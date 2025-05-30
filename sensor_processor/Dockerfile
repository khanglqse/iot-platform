FROM python:3.10-slim

WORKDIR /app

COPY processor.py .

RUN pip install kafka-python
RUN pip install --upgrade kafka-python

CMD ["python", "processor.py"]
