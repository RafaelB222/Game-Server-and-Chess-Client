using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Server
{
    internal class UsernameGenerator
    {
        private List<string> _previousUsernames;
        private List<string> _adjectives;
        private List<string> _animals;
        public UsernameGenerator()
        {
            _previousUsernames = new List<string>();
            _adjectives = new List<string>
            {
                "Adventurous", "Ambitious", "Artistic", "Caring", "Charismatic",
                "Compassionate", "Creative", "Determined", "Energetic", "Friendly",
                "Generous", "Imaginative", "Intelligent", "Kind", "Loyal",
                "Optimistic", "Passionate", "Patient", "Resilient", "Sincere",
                "Thoughtful", "Trustworthy", "Versatile", "Witty"
            };
            _animals = new List<string>
            {
                "Lion", "Tiger", "Elephant", "Giraffe", "Kangaroo",
                "Penguin", "Cheetah", "Hippopotamus", "Leopard", "Zebra",
                "Koala", "Gorilla", "Rhinoceros", "Panda", "Crocodile",
                "Ostrich", "Peacock", "Sloth", "Koala", "Meerkat",
                "Polar Bear", "Jaguar", "Orangutan", "Lynx"
            };            
        }

        public string GenerateRandomUsername()
        {
            Random random = new Random();
            string randomUsername = _adjectives[random.Next(_adjectives.Count)] + _animals[random.Next(_animals.Count)];

            while(_previousUsernames.Contains(randomUsername))
            {
                randomUsername = _adjectives[random.Next(_adjectives.Count)] + _animals[random.Next(_animals.Count)];
            }

            _previousUsernames.Add(randomUsername);

            return randomUsername;
        }

        public void RemoveUsername(string username)
        {
            _previousUsernames.Remove(username);
        }

        public List<string> GetPreviousUsernames()
        {
            return _previousUsernames;
        }

    }
}
