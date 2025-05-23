docker pull ollama/ollama:latest
#docker run -d --gpus=all -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama
docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama
docker start ollama
docker stop ollama
docker exec -it ollama ollama run samantha-mistral:7b
#docker exec -it ollama bash