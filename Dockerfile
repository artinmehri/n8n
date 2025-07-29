FROM n8nio/n8n:latest

WORKDIR /data

EXPOSE 5678

CMD ["n8n", "start"]
