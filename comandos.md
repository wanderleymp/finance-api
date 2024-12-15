# Comandos Úteis

## Liberar Porta 3000

### Listar processos na porta 3000
```bash
lsof -i :3000
```

### Matar processos na porta 3000
```bash
# Método 1: Usando lsof e kill
lsof -t -i:3000 | xargs kill -9

# Método 2: Usando fuser
fuser -k 3000/tcp
```

## Verificar Conexões de Rede
```bash
# Mostrar todas as conexões na porta 3000
netstat -tuln | grep 3000

# Mostrar processos usando a porta
ss -tuln | grep 3000
```

## Reiniciar Serviço
```bash
# Reiniciar o serviço Node.js
pm2 restart all
# ou
systemctl restart finance-api
```

## Limpar Processos Zumbis
```bash
# Matar todos os processos Node.js
pkill -f node
```

## Logs e Diagnóstico
```bash
# Ver logs do serviço
journalctl -u finance-api

# Ver processos Node.js
ps aux | grep node
```
