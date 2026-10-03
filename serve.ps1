param (
    [int]$Port = 8080,
    [string]$Path = $PSScriptRoot
)

$source = @"
using System;
using System.IO;
using System.Net;
using System.Threading;
using System.Text;

public class StaticServer
{
    private HttpListener _listener;
    private string _rootPath;
    private int _port;

    public StaticServer(string rootPath, int port)
    {
        _rootPath = Path.GetFullPath(rootPath);
        _port = port;
        _listener = new HttpListener();
        _listener.Prefixes.Add("http://localhost:" + port + "/");
        _listener.Prefixes.Add("http://127.0.0.1:" + port + "/");
    }

    public void Start()
    {
        _listener.Start();
        Console.WriteLine("[SERVER] Started on http://localhost:" + _port + "/");
        ThreadPool.QueueUserWorkItem((_) => ListenLoop());
    }

    private void ListenLoop()
    {
        while (_listener.IsListening)
        {
            try
            {
                var context = _listener.GetContext();
                ThreadPool.QueueUserWorkItem((ctx) => ProcessRequest((HttpListenerContext)ctx), context);
            }
            catch (Exception ex)
            {
                if (!_listener.IsListening) break;
                Console.WriteLine("[ERR] Listener: " + ex.Message);
            }
        }
    }

    private void ProcessRequest(HttpListenerContext context)
    {
        var request = context.Request;
        var response = context.Response;

        try
        {
            response.AddHeader("Access-Control-Allow-Origin", "*");
            response.AddHeader("Cache-Control", "no-cache");

            string urlPath = request.Url.LocalPath.TrimStart('/');
            if (string.IsNullOrEmpty(urlPath)) urlPath = "index.html";

            string filePath = Path.Combine(_rootPath, urlPath.Replace('/', Path.DirectorySeparatorChar));

            if (File.Exists(filePath))
            {
                string ext = Path.GetExtension(filePath).ToLower();
                string contentType = "application/octet-stream";

                switch (ext)
                {
                    case ".html": contentType = "text/html; charset=utf-8"; break;
                    case ".css":  contentType = "text/css; charset=utf-8"; break;
                    case ".js":   contentType = "application/javascript; charset=utf-8"; break;
                    case ".json": contentType = "application/json; charset=utf-8"; break;
                    case ".png":  contentType = "image/png"; break;
                    case ".jpg":
                    case ".jpeg": contentType = "image/jpeg"; break;
                    case ".svg":  contentType = "image/svg+xml"; break;
                    case ".glb":  contentType = "model/gltf-binary"; break;
                    case ".gltf": contentType = "model/gltf+json"; break;
                }

                byte[] data = File.ReadAllBytes(filePath);
                response.ContentType = contentType;
                response.ContentLength64 = data.Length;
                response.StatusCode = 200;
                response.OutputStream.Write(data, 0, data.Length);
            }
            else
            {
                response.StatusCode = 404;
                byte[] notFound = Encoding.UTF8.GetBytes("404 Not Found");
                response.ContentLength64 = notFound.Length;
                response.OutputStream.Write(notFound, 0, notFound.Length);
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine("[REQ ERR] " + ex.Message);
        }
        finally
        {
            try { response.Close(); } catch {}
        }
    }

    public void Stop()
    {
        try { _listener.Stop(); } catch {}
    }
}
"@

Add-Type -TypeDefinition $source

$server = New-Object StaticServer($Path, $Port)
$server.Start()

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " ROYAL ENFIELD // ZERO-GRAVITY 3D EXPERIENCE" -ForegroundColor Green
Write-Host " Server running at http://localhost:$Port/" -ForegroundColor Yellow
Write-Host " Press Enter to stop server" -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Cyan

while ($true) {
    Start-Sleep -Seconds 1
}
