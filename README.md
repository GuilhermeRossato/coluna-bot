# Coluna Bot

Isso é um robo que verifica se um determinado streamer está com postura ruim e, se tiver, envia uma notificação pra ele arrumar a postura.

# Tech stack

Usamos NodeJS para orquestrar o browser com o módulo puppeteer (do chromium) para acessar a twitch e usamos Tensorflow para verificar as imagens do streamer e verificar ele está ou não com a postura correta. Se eles estiver virando o corcunda de notre damme a rede neural vai enviar uma notificação e uma mensagem no chat.