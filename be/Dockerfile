FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# Create a startup script
COPY start.sh .
RUN chmod +x start.sh

CMD ["./start.sh"] 