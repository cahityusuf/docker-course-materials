# Modül 6 - BuildKit cache mount ile Python uygulaması
# syntax direktifi BuildKit'in modern özellikleri için zorunlu
# syntax=docker/dockerfile:1.7

FROM python:3.12-slim

WORKDIR /app

# pip cache'ini imaja YAZMADAN, build'ler arası kalıcı tut
# Bu sayede ikinci build'inizde pip indirme adımı saniyeler sürer
COPY requirements.txt .
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --no-warn-script-location -r requirements.txt

COPY app.py .

# Non-root kullanıcı oluştur
RUN useradd -m -u 1001 app && chown -R app:app /app
USER app

ENV PYTHONUNBUFFERED=1 \
    FLASK_ENV=production \
    PORT=5000

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5000/health').read()" || exit 1

# gunicorn 2 worker ile prod-ready başlatma (dev için 'flask run' kullanılır)
CMD ["gunicorn", "-w", "2", "-b", "0.0.0.0:5000", "--access-logfile", "-", "app:app"]
