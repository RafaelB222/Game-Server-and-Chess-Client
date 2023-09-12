using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Server
{
    internal class HttpResponseBuilder
    {
        private int _statusCode;
        private string _statusMessage;
        private string _body;
        private string _contentType;
        private int _contentLength;
        private Dictionary<string, string> _headers;
        


        public HttpResponseBuilder(int statusCode, string jsonContent)
        {
            _statusCode = statusCode;
            _statusMessage = "";
            _contentType = "application/json";
            _contentLength = 0;
            _headers = new Dictionary<string, string>();
            _body = jsonContent;

        }

        public string GetFormattedResponse()
        {
            StringBuilder responseBuilder = new StringBuilder();

            // Status line
            responseBuilder.Append("HTTP/1.1 ").Append(_statusCode).Append(" ").Append(GetStatusMessage(_statusCode)).Append("\r\n");

            // Headers
            responseBuilder.Append("Content-Type: application/json\r\n");
            responseBuilder.Append("Content-Length: ").Append(Encoding.UTF8.GetByteCount(_body)).Append("\r\n");

            // Empty line to separate headers and body
            responseBuilder.Append("\r\n");

            // Body
            responseBuilder.Append(_body);

            return responseBuilder.ToString();
        }

        private string GetStatusMessage(int statusCode)
        {
            switch (statusCode)
            {
                case 200:
                    return "OK";
                case 204:
                    return "No Content";
                case 400:
                    return "Bad Request";
                case 403:
                    return "Forbidden";
                case 404:
                    return "Not Found";
                default:
                    return "Unknown";
            }
        }
    }
}
