using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Server
{
    internal class Player
    {
        private string _username;

        public Player(UsernameGenerator generator)
        {
            _username = generator.GenerateRandomUsername();
        }

        public string getUsername() { return _username; }   
    }
}
