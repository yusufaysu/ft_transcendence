YML_FILE	= ./srcs/docker-compose.yml

all:
	sudo docker-compose -f $(YML_FILE) up --build

down:
	sudo docker-compose -f $(YML_FILE) down

re: clean all

.PHONY: all clean re 