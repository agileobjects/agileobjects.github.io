using System;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using System.Web.Http;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.Extensions.Logging;

namespace AgileObjects.Functions.Email
{
    public static class SendEmail
    {
        [FunctionName("SendEmail")]
        public static async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Function, "post", Route = null)] HttpRequest request,
            ILogger log)
        {
            log.LogTrace("AgileObjects.Functions.Email triggered");

            var formContent = await request.ReadFormAsync();

            if (!TryGetEmailDetails(formContent, out var mail, out var errorMessage))
            {
                return new BadRequestErrorMessageResult(errorMessage);
            }

            var client = new SmtpClient
            {
                EnableSsl = false,
                DeliveryMethod = SmtpDeliveryMethod.Network,
                UseDefaultCredentials = false,
                Host = "mail.agileobjects.co.uk",
                Credentials = new NetworkCredential("steve@agileobjects.co.uk", "R$ZhAKPlXEU7U7P$3l")
            };

            try
            {
                using (client)
                {
                    client.Send(mail);
                }

                log.LogInformation("Email sent.");

                return new OkResult();
            }
            catch (Exception ex)
            {
                log.LogError(ex, "Message not sent. An unspecified error occurred.");

                return new InternalServerErrorResult();
            }
        }

        private static bool TryGetEmailDetails(
            IFormCollection formContent,
            out MailMessage mail,
            out string errorMessage)
        {
            if (!formContent.TryGetValue("name", out var name) ||
                !formContent.TryGetValue("email", out var email) ||
                !formContent.TryGetValue("email", out var message))
            {
                mail = null;
                errorMessage = "Missing email details.";
                return false;
            }

            if (string.IsNullOrWhiteSpace(name) ||
                string.IsNullOrWhiteSpace(email) ||
                string.IsNullOrWhiteSpace(message))
            {
                mail = null;
                errorMessage = "Blank email details.";
                return false;
            }

            try
            {
                new MailAddress(email);
            }
            catch (FormatException)
            {
                mail = null;
                errorMessage = "Invalid from email.";
                return false;
            }

            mail = new MailMessage(
                $"{name} {email}",
                "steve@agileobjects.co.uk",
                "Email from agileobjects.co.uk",
                message);

            errorMessage = null;
            return true;
        }
    }
}
