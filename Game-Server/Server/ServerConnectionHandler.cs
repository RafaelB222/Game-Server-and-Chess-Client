using Microsoft.VisualBasic;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Net.Sockets;
using System.Runtime.CompilerServices;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;



namespace Server
{
    internal class ServerConnectionHandler
    {
        private Socket _client;
        private UsernameGenerator _usernameGenerator;
        private ConcurrentDictionary<string, GameRecord> _gameQueue;
        private bool _playing;
        private string _threadName;
        string _clientUsername;
        string _clientGameID;

        public ServerConnectionHandler(Socket client, UsernameGenerator usernameGenerator, ConcurrentDictionary<string, GameRecord> gameQueue, string threadName)
        {
            _client = client;
            _usernameGenerator = usernameGenerator;
            _gameQueue = gameQueue;
            _playing = true;
            _threadName = threadName;
            _clientUsername = "";
            _clientGameID = "";
        }
        public void HandleClientConnection()
        {
            
            try
            {
                StringBuilder requestBuilder = new StringBuilder();
                int contentLength = 0;
                bool endOfHeaders = false;
                Console.WriteLine("Waiting for a message from the client");


                while (_playing)
                {
                    byte[] buffer = new byte[1024];
                    var receivedBytes = _client.Receive(buffer, SocketFlags.None);

                    if(receivedBytes == 0)
                    {
                        break;
                    }

                    var receivedData = Encoding.UTF8.GetString(buffer, 0, receivedBytes);                    
                    requestBuilder.Append(receivedData);
                    string request = requestBuilder.ToString();

                    if (!endOfHeaders && request.Contains("\r\n\r\n"))
                    {
                        Console.WriteLine("reached end of headers");
                        endOfHeaders = true;

                        // Extract the content length from headers
                        string[] headers = request.Split(new[] { "\r\n" }, StringSplitOptions.RemoveEmptyEntries);
                        foreach (string header in headers)
                        {
                            if (header.StartsWith("Content-Length:", StringComparison.OrdinalIgnoreCase))
                            {
                                int.TryParse(header.Substring("Content-Length:".Length).Trim(), out contentLength);
                                break;
                            }
                        }
                    }

                    if (endOfHeaders && request.Length - request.IndexOf("\r\n\r\n") - 4 >= contentLength)
                    {
                        Console.WriteLine("received complete request");

                        // We have received the complete request or response
                        // Process the request here
                        if (!IsValidRequestType(request))
                        {
                            string errorMessage = "Invalid request type for " + request;
                            string errorJson = JsonSerializer.Serialize(new { error = errorMessage });
                            FormatAndSendHttpResponse(400, errorJson);
                            Console.WriteLine("Invalid request type");
                            requestBuilder.Clear();
                            contentLength = 0;
                            endOfHeaders = false;
                            continue;
                        }


                        string[] requestTokens = request.Split(' ');
                        string endpoint = requestTokens[1];
                        Dictionary<string, string> queryParams = ParseQueryParameters(ref endpoint);
                        if(!IsValidEndpoint(endpoint))
                        {
                            //handle invalid or unknown endpoints
                            string errorMessage = "Invalid endpoint " + endpoint;
                            string errorJson = JsonSerializer.Serialize(new { error = errorMessage });
                            FormatAndSendHttpResponse(400, errorJson);
                            continue;
                        }

                        if(IsValidQueryParams(queryParams, endpoint))
                        {
                            string errorMessage = "Invalid queryParams found in " + queryParams;
                            string errorJson = JsonSerializer.Serialize(new { error = errorMessage });
                            FormatAndSendHttpResponse(400, errorJson);
                            continue;
                        }
                        //If invalid parameters are found need to send a 400 response and skip the rest of the loop. 

                        switch (endpoint)
                        {
                            case "/register":
                                HandleRegisterRequest();
                                break;
                            case "/pairme":
                                HandlePairmeRequest(queryParams);
                                break;
                            case "/mymove":
                                HandleMymoveRequest(queryParams);
                                break;
                            case "/theirmove":
                                HandleTheirmoveRequest(queryParams);
                                break;
                            case "/quit":
                                HandleQuit(queryParams);
                                break;                            
                        }
                        Console.WriteLine(request);
                        Console.WriteLine(endpoint);

                        // Clear the request builder for the next iteration
                        requestBuilder.Clear();
                        contentLength = 0;
                        endOfHeaders = false;
                    }

                    
                }

                Console.WriteLine("client closed.");
                RemoveClientUsernameAndGameRecord();
                _client.Shutdown(SocketShutdown.Both);
                _client.Close();
                

            } catch (Exception ex)
            {
                Console.WriteLine("An error occurred at the server end {0}", ex.Message);
            }
        }

        private Dictionary<string, string> ParseQueryParameters(ref string endpoint)
        {
            var queryParams = new Dictionary<string, string>();

            int questionMarkIndex = endpoint.IndexOf('?');
            if (questionMarkIndex >= 0)
            {
                string queryString = endpoint.Substring(questionMarkIndex + 1);
                string[] paramPairs = queryString.Split('&');
                foreach (string paramPair in paramPairs)
                {
                    string[] keyValue = paramPair.Split('=');
                    if (keyValue.Length == 2)
                    {
                        string key = Uri.UnescapeDataString(keyValue[0]);
                        string value = Uri.UnescapeDataString(keyValue[1]);
                        queryParams[key] = value;
                    }
                }
                // Remove the query parameters from the endpoint string
                endpoint = endpoint.Substring(0, questionMarkIndex);
            }

            return queryParams;
        }

        private void HandleRegisterRequest()
        {
            //generate a username for the client and send it back to the client. Lock the _usernameGenerator while this occurs. 
            lock (_usernameGenerator)
            {
                Player player = new Player(_usernameGenerator);
                string playerName = player.getUsername();
                _clientUsername = playerName;
                var playerNameObject = new { username = playerName };
                string playerNameJson = JsonSerializer.Serialize(playerNameObject);
                FormatAndSendHttpResponse(200, playerNameJson);
                Console.WriteLine(_threadName + " sent response to " + _client.RemoteEndPoint + " for /register");
            }
        }

        private void HandlePairmeRequest(Dictionary<string, string> queryParams)
        {
            //check if the client is already in an active game
            if (_gameQueue.ContainsKey(_clientGameID) && _gameQueue[_clientGameID].GameState == "progress")
            {
                string message = "you are already in a game and cannot join another";
                string messageJson = JsonSerializer.Serialize(message);
                FormatAndSendHttpResponse(403, messageJson);
            }

            //check if the client is already in a game that is waiting for another player. If it is, then return the game record. 
            GameRecord gameAlreadyJoined = _gameQueue.Values.FirstOrDefault(g => g.Player1 == queryParams["player"]);
            if (gameAlreadyJoined != null)
            {
                string gameJson = gameAlreadyJoined.ToJson();
                FormatAndSendHttpResponse(200, gameJson);

            } else
            {
                //If the client is not waiting for a game, check if there are any games that are waiting for a second player. 
                GameRecord game = _gameQueue.Values.FirstOrDefault(g => g.GameState == "wait");

                if (game != null)
                {
                    //If a waiting game is found, update the game record with the client's username and set the gameState to progress. 
                    _clientGameID = game.GameID;
                    game.Player2 = queryParams["player"];
                    game.GameState = "progress";
                    string gameJson = game.ToJson();
                    FormatAndSendHttpResponse(200, gameJson);
                }
                else
                {
                    //If no waiting game is found, create a new game with the client as player 1 and the gameState set to wait. 
                    GameRecord newGame = new GameRecord();
                    _clientGameID = newGame.GameID;
                    newGame.Player1 = queryParams["player"];
                    _gameQueue.TryAdd(newGame.GameID, newGame);
                    Console.WriteLine("game id = " + newGame.GameID + " player 1 = " + newGame.Player1 + " game state = " + newGame.GameState);
                    string newGameJson = newGame.ToJson();
                    Console.WriteLine(newGameJson);
                    FormatAndSendHttpResponse(200, newGameJson);

                }
            }            
            Console.WriteLine(_threadName + " sent response to " + _client.RemoteEndPoint + " for /pairme?player=" + queryParams["player"]);

        }

        private void HandleMymoveRequest(Dictionary<string, string> queryParams)
        {
            //check if the _gameQueue contains a game with the specified id. 
            if (_gameQueue.ContainsKey(queryParams["id"]))
            {
                //If a game is found, check if the client making the request is player 1 or 2, and then modify the appropriate last move in the GameRecord. 
                string gameID = queryParams["id"];
                GameRecord currentGame = _gameQueue[gameID];
                if(currentGame.Player1 == queryParams["player"])
                {
                    currentGame.Player1LastMove = queryParams["move"];
                } else
                {
                    currentGame.Player2LastMove = queryParams["move"];
                }
                FormatAndSendHttpResponse(204, "");
                Console.WriteLine(_threadName + " sent response to " + _client.RemoteEndPoint + " for /mymove?player=" + queryParams["player"] + "id=" + queryParams["id"] + "move=" + queryParams["move"]);
            }
            else
            {
                //If the gameID was not found, return an error message. 
                string errorMessage = "game not found";
                var errorObject = new { error = errorMessage };
                string json = JsonSerializer.Serialize(errorObject);
                FormatAndSendHttpResponse(404, json);
            }
        }

        private void HandleTheirmoveRequest(Dictionary<string, string> queryParams)
        {
            //check if the _gameQueue contains a game with the specified id. 
            if (_gameQueue.ContainsKey(queryParams["id"]))
            {
                //If a game is found, check if the client making the request is player 1 or 2, and then retrieve the appropriate last move in the GameRecord and send to client. 
                string gameID = queryParams["id"];
                GameRecord currentGame = _gameQueue[gameID];
                if (currentGame.Player1 == queryParams["player"])
                {
                    string theirMove = currentGame.Player2LastMove;
                    var moveObject = new { move = theirMove };
                    string theirMoveJson = JsonSerializer.Serialize(moveObject);
                    FormatAndSendHttpResponse(200, theirMoveJson);
                }
                else
                {
                    string theirMove = currentGame.Player1LastMove;
                    var moveObject = new { move = theirMove };
                    string theirMoveJson = JsonSerializer.Serialize(moveObject);
                    FormatAndSendHttpResponse(200, theirMoveJson);
                }
                Console.WriteLine(_threadName + " sent response to " + _client.RemoteEndPoint + " for /theirmove?player=" + queryParams["player"] + "id=" + queryParams["id"]);
            }
            else
            {
                string errorMessage = "game not found";
                var errorObject = new { error = errorMessage };
                string json = JsonSerializer.Serialize(errorObject);
                FormatAndSendHttpResponse(404, json);
            }
        }

        private void HandleQuit(Dictionary<string, string> queryParams)
        {
            //Set playing to false, remove the specified game from the _gameQueue and send message back to client. 
            _playing = false;
            _gameQueue.TryRemove(queryParams["id"], out _);
            Console.WriteLine(queryParams["player"] + " has quit the game.");
            string message = "you quit the game";
            var messageObject = new { message };
            string messageJson = JsonSerializer.Serialize(messageObject);
            FormatAndSendHttpResponse(200, messageJson);
            Console.WriteLine(_threadName + " sent response to " + _client.RemoteEndPoint + " for /quit?player=" + queryParams["player"] + "id=" + queryParams["id"]);
        }

        private void FormatAndSendHttpResponse(int statusCode, string jsonContent) 
        {
            HttpResponseBuilder responseBuilder = new HttpResponseBuilder(statusCode, jsonContent);
            string responseString = responseBuilder.GetFormattedResponse();
            byte[] responseBytes = Encoding.UTF8.GetBytes(responseString);
            _client.Send(responseBytes);
        }

        private bool IsValidRequestType(string request)
        {            
            return request.StartsWith("GET");
        }

        private bool IsValidEndpoint(string endpoint)
        {
            bool isValid = false;
            switch (endpoint)
            {
                case "/register":
                    isValid = true;
                    break;
                case "/pairme":
                    isValid = true;
                    break;
                case "/mymove":
                    isValid = true;
                    break;
                case "/theirmove":
                    isValid = true;
                    break;
                case "/quit":
                    isValid = true;
                    break;
                default:                    
                    isValid = false;
                    break;
            }
            return isValid;
        }

        private bool IsValidQueryParams(Dictionary<string, string> queryParams, string endpoint)
        {
             
            bool isValid = false;
           if(endpoint == "/register")
            {
                isValid = (queryParams.Count == 0);
            } else if(endpoint == "/pairme") {
                isValid = (queryParams["player"] == _clientUsername);
            } else if(endpoint == "/mymove" || endpoint == "/theirmove" || endpoint == "/quit")
            {
                isValid = (queryParams["player"] == _clientUsername && queryParams["id"] == _clientGameID);
            }
           
           return isValid;

        }

        private void RemoveClientUsernameAndGameRecord()
        {
            lock (_usernameGenerator)
            {
                _usernameGenerator.GetPreviousUsernames().Remove(_clientUsername);
            }

            _gameQueue.TryRemove(_clientGameID, out _);
        }
    }
}
