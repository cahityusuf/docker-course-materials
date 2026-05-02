"""
Modul 6 - BuildKit cache mount ornegi icin Flask uygulamasi
"""
import os
import socket
import time
from flask import Flask, jsonify

app = Flask(__name__)
START = time.time()


@app.route("/")
def index():
    env = os.getenv("FLASK_ENV", "development")
    return (
        f"Merhaba Docker'dan Python!\n"
        f"Ortam        : {env}\n"
        f"Hostname     : {socket.gethostname()}\n"
        f"Uptime       : {int(time.time() - START)} saniye\n"
    ), 200, {"Content-Type": "text/plain; charset=utf-8"}


@app.route("/health")
def health():
    return jsonify(status="ok", uptime=time.time() - START)


if __name__ == "__main__":
    # Sadece geliştirme için; prod'da gunicorn kullanılır (Dockerfile CMD'ye bakın)
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5000")))
