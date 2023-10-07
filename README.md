# Game-Server-and-Chess-Client

## running the server:
To run the server, simply open the folder extracted contents of the server-rbuc039.zip file. 

Open the Assignment 2 Server folder and you will find the Assignment_2.sln file.

Double-click this file to open the solution in Visual Studio. 

Click the green start arrow at the top of the Visual Studio Window. 

A console window will open that will dosplay the server is running at the specified endpoint. 

##Running the client:
**A few notes about the client:
This was initially made for a university assignment that had some specific requirements. Firstly the client files could only consist of a single javescript, css and html file. No third party libraries could be used. This meant I could not use a Chess library like Chess.js, so had to make the chess logic manually from scratch. I have not yet finished implementing the full logic for a complete chess game.** 

In order to run the client application, open the index.html file using the browser of your choice.

Make sure the server is running before doing anything else. 

In the browser client you will find a chess board and three buttons. 

As long as the server is running, you will be able to click the register button to receive a username from the server. This 
can be checked by looking at the borwser console logs. 

At this point I would recommend opening the browser-client html file in a different browser. 

On the second browser, click the register button. This client will also be given a username. 

Then one either client, you can click the find a game button. This will send a request to the /pairme endpoint, and will 
continue sending requests until the game it has joined as a gameState of progress. 

On the other browser, click the find a game button, and you will see in the console logs of the browsers that both clients have
joined the same game. 

The client which found the game first, that is the one that was waiting, is the player with the white pieces. 

The client with the white pieces may move a piece by clicking on a piece. Legal moves will be highlighted. The piece can 
be moved by then clicking on one of the highlighted squares. 

Once the move has been carried out, check the other browser and you should see that the board is updated. The board can take 
several seconds to update so please be patient. 

Once the board is updated on the client with black pieces, that client may move. 

You may then keep exchanging moves between the clients. Once again, please wait for the board to update before making each move. 

Full chess logic has not been implemented, so a winner will not be determined. 

A player may quit at any time by clicking the quit button. 

Once a game is quit, it may not be rejoined.
