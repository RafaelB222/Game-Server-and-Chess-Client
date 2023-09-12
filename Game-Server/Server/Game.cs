using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Server
{
    internal class Game
    {
        private GameRecord _gameRecord;

        public Game()
        {
            _gameRecord = new GameRecord();
        }

        public GameRecord GetGameRecord()
        {
            return _gameRecord;
        }
    }
}
