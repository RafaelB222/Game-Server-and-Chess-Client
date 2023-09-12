using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Sockets;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using System.Collections.Concurrent;

namespace Server
{
    internal class ServerListener
    {
        private UsernameGenerator _usernameGenerator;
        private ConcurrentDictionary<string, GameRecord> _gameQueue;
        private int _threadCount;
        private object _usernameLock;

        public ServerListener() 
        { 
            _usernameGenerator = new UsernameGenerator();
            _gameQueue = new ConcurrentDictionary<string, GameRecord>();
            _threadCount = 0;
        }

        public async Task StartListening()
        {
            IPAddress address = IPAddress.Parse("127.0.0.1");
            var localEndpoint = new IPEndPoint(address, 8080);

            Socket listener = new Socket(AddressFamily.InterNetwork, SocketType.Stream, ProtocolType.Tcp);

            try
            {
                listener.Bind(localEndpoint);
                listener.Listen(10);
                Console.WriteLine("Server listening on: " + address.ToString());

                while (true)
                {
                    Socket client = await listener.AcceptAsync();
                    Console.WriteLine("Client connected from {0}", client.RemoteEndPoint);
                    
                    string threadName = "Thread " + _threadCount++;
                    ServerConnectionHandler clientHandler = new ServerConnectionHandler(client, _usernameGenerator, _gameQueue, threadName);
                    Thread clientThread = new Thread(new ThreadStart(clientHandler.HandleClientConnection));
                    
                    clientThread.Start();
                }

                

            } catch (Exception ex)
            {
                Console.WriteLine($"Failed to listen {ex}");
            }
        }

        
    }
}
