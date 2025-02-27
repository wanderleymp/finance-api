import websocket
import json
import ssl

# Desabilitar verificação de certificado
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

# Token de autenticação
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjYsImlhdCI6MTc0MDY1MjczMiwiZXhwIjoxNzQwNjY3MTMyfQ.Nv09Q-6_bRqy4QmGcHC2rJJQfdK2fmN9dWEzZwQ_rP0"

# URL do WebSocket
url = "wss://dev.agilefinance.com.br/chats"

def on_message(ws, message):
    print(f"Mensagem recebida: {message}")

def on_error(ws, error):
    print(f"Erro: {error}")

def on_close(ws, close_status_code, close_msg):
    print("### Conexão fechada ###")

def on_open(ws):
    print("Conexão WebSocket estabelecida!")
    
    # Enviar evento de autenticação
    ws.send(json.dumps({
        "event": "authenticate",
        "token": token
    }))

# Criar WebSocket
websocket.enableTrace(True)
ws = websocket.WebSocketApp(url,
                             header={"Authorization": f"Bearer {token}"},
                             on_open=on_open,
                             on_message=on_message,
                             on_error=on_error,
                             on_close=on_close)

# Iniciar conexão
ws.run_forever(sslopt={"cert_reqs": ssl.CERT_NONE})
