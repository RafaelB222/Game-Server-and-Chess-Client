using System;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;

namespace Server
{
    
    internal class ServerStart
    {
        static async Task Main(string[] args)
        {
            ServerListener listener = new ServerListener();
            await listener.StartListening();
            Console.WriteLine("Press enter to exit...");
            Console.ReadLine();
        }
    }
}