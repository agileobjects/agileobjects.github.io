namespace AgileObjects.Email
{
    using System;
    using System.Net;
    using System.Net.Http;
    using System.Net.Mail;
    using System.Threading.Tasks;
    using Microsoft.Azure.WebJobs;
    using Microsoft.Azure.WebJobs.Host;
    using Microsoft.CSharp.RuntimeBinder;
    using Newtonsoft.Json;

    public static class AgileObjectsEmail
    {
        [FunctionName("AgileObjectsEmail")]
        public static async Task<object> Run(HttpRequestMessage request, TraceWriter log)
        {
            log.Verbose("AgileObjectsEmail Function App triggered");

            var jsonContent = await request.Content.ReadAsStringAsync();

            if (!TryGetEmailDetails(jsonContent, out var name, out var email, out var subject, out var message, out var errorMessage))
            {
                return request.CreateResponse(HttpStatusCode.BadRequest, errorMessage);
            }

            var mail = new MailMessage(
                $"{name} {email}",
                "steve@agileobjects.co.uk",
                subject,
                message);

            var client = new SmtpClient
            {
                EnableSsl = false,
                DeliveryMethod = SmtpDeliveryMethod.Network,
                UseDefaultCredentials = false,
                Host = "mail.agileobjects.co.uk",
                Credentials = new NetworkCredential("steve@agileobjects.co.uk", "i%8T@LY1uP4G9BA")
            };

            try
            {
                using (client)
                {
                    client.Send(mail);
                }

                log.Verbose("Email sent.");

                return request.CreateResponse(HttpStatusCode.OK);
            }
            catch (Exception ex)
            {
                log.Verbose(ex.ToString());

                return request.CreateResponse(
                    HttpStatusCode.InternalServerError,
                    "Message has not been sent. An unspecified error occurred.");
            }
        }

        private static bool TryGetEmailDetails(
            string jsonContent,
            out string name,
            out string email,
            out string subject,
            out string message,
            out string errorMessage)
        {
            name = null;
            email = null;
            subject = null;
            message = null;

            dynamic data = JsonConvert.DeserializeObject(jsonContent);

            try
            {
                name = data.name;
                email = data.email;
                subject = data.subject;
                message = data.message;
            }
            catch (RuntimeBinderException)
            {
                errorMessage = "Message has not been sent. Email details could not be retrieved.";
                return false;
            }

            if (string.IsNullOrWhiteSpace(email) ||
                string.IsNullOrWhiteSpace(subject) ||
                string.IsNullOrWhiteSpace(message))
            {
                errorMessage = "Message has not been sent. Email details were missing.";
                return false;
            }

            try
            {
                new MailAddress(email);
            }
            catch (FormatException)
            {
                {
                    errorMessage = "Message has not been sent. From email was invalid.";
                    return false;
                }
            }

            errorMessage = null;
            return true;
        }
    }
}
