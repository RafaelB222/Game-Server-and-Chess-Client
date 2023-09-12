using System;
using System.Collections.Generic;
using System.Text.Json;

namespace Server
{
    internal class GameRecord
    {
        public string GameID { get; }
        public string GameState { get; set; }
        public string Player1 { get; set; }
        public string Player2 { get; set; }
        public string Player1LastMove { get; set; }
        public string Player2LastMove { get; set; }

        public GameRecord()
        {
            Guid guid = Guid.NewGuid();
            GameID = guid.ToString();
            GameState = "wait";
            Player1 = "";
            Player2 = "";
            Player1LastMove = "";
            Player2LastMove = "";
        }

        public string ToJson()
        {
            var options = new JsonSerializerOptions
            {
                WriteIndented = true // Optional: Format the JSON with indentation
            };
            return JsonSerializer.Serialize(this, options);
        }
    }
}