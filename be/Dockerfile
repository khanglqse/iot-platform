FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .            # copy hết code trước

COPY start.sh .     # copy lại file start.sh sau cùng
RUN chmod +x start.sh

EXPOSE 8000

CMD ["./start.sh"]
