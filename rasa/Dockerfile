FROM rasa/rasa:3.6.2

USER root

# Copy requirements first to leverage Docker cache
COPY requirements.txt .

# Cài đặt các dependencies cho tiếng Việt
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir transformers==4.38.2 torch==2.2.2 jieba

WORKDIR /app

# Copy only necessary files
COPY --chown=1001:1001 config.yml domain.yml ./
COPY --chown=1001:1001 data/ data/

# Train model
# RUN rasa train

EXPOSE 5005
EXPOSE 5055
USER 1001

CMD [ "run", "--enable-api", "--cors", "*" ] 