# Комментарий от исполнителя:
1. Сокеты сделал, но не отлаживал и не покрыл тестами. Дефицит времени.
2. Не обработал ситуацию, в которой одна строка частью прилетает в первом чанке, а частью - уже во втором.
3. Совокупно на задачу ушло 5 часов.

# Условия:
Имеется скрипт для обработки логов. Разработчик, писавший его, закончил только копирование из одного файла в другой.

# Задача:
Переписать приложение для приведения логов, поступающих из разных источников, в оговоренный формат и выдаче в выходной поток в зависимости от настроек.

Добавить возможность использовать как источник/потребитель данных `TCP` сокеты.

Добавить возможность фильтровать сообщения по `type`: `ERROR`, `WARNING`, `INFO`, `DEBUG` перед выдачей в поток.

## Формат входных данных
Каждая строка, это отдельное сообщение от сервера или клиента. Но иногда могут проскакивать многострочные стектрейсы.

### Формат логов клиента
`{type: <String>, message: <String>, error: <String>, timestamp: <Number>, environment: <String>, app: <String>, ip: <String>}`

Пример:
```
{"type": "client", "message": "An application event log entry..", "timestamp": 1518176440, "environment": "prod", "ip": "127.0.0.1", "app": "client_app"}
{"type": "client", "error": "Error!", "timestamp": 1518176440, "environment": "prod", "ip": "127.0.0.1", "app": "client_app"}
```

### Формат логов сервера
Логи сервера формируются согласно стандарту [RFC 5424](https://tools.ietf.org/html/rfc5424). Особое внимание следует обратить на раздел со `Structured Data`.

`<${prival}>${version} ${timestamp} ${host} ${app} ${pid} ${mid} ${structured-data} ${message}`

Пример:
```
<13>1 2018-02-09T12:00:00.003Z 127.0.0.1 app 10000 - [info@app env="prod" type="server"] Server log
```

## Формат выходных данных
Выходные данные должны иметь формат JSON и представлять из себя следующий объект:
```
{
  logsource: <String>,
  program: <String>
  host: <String>,
  env: <String>,
  type: <String>,
  timestamp: <String>,
  message: <String>,
  _data: <Object>
}
```
Поле `type` для клиентских логов, принимает значение `INFO` или `ERROR`, в зависимости от того, указан ли во входных данных `message` или `error`.

Для серверных логов, значение поле `type` вычисляется из значения `prival`. Из `prival` нужно вычислить `severity` и в зависимости от получившегося числового значения, подставить соотвествующее значение для `type`:
- 0 - ERROR
- 1 - ERROR
- 2 - ERROR
- 3 - ERROR
- 4 - WARNING
- 5 - INFO
- 6 - INFO
- 7 - DEBUG

Подробнее о `prival` и `severity` читайте в [RFC 5424](https://tools.ietf.org/html/rfc5424).

Важно знать, что не всегда все нужные поля будут в логах, а иногда будут даже лишние. В случае наличия лишних данных, их следует поместить в объект `_data`. В случае отсутствия нужных данных, поля можно оставить пустыми.

Пример для клиентских логов:
```
// In:
{"type": "client", "message": "Message", "timestamp": 1518176440, "environment": "prod", "ip": "127.0.0.1", "app": "client_app", "user_id": 1}

// Out:
{
  "logsource": "client",
  "program": "client_app",
  "host": "127.0.0.1",
  "env": "prod",
  "type": "INFO",
  "timestamp": "2003-10-11T22:14:15.003Z",
  "message": "Message",
  "_data": {
    "user_id": 1
  }
}
```

Пример для серверных логов:
```
// In:
<11>1 2018-02-09T12:00:00.003Z 127.0.0.1 app 10000 - [info@app env="prod" type="server" some="data"][data@app some="data"] Error

// Out:
{
  "logsource": "server",
  "program": "app",
  "host": "127.0.0.1",
  "env": "prod",
  "type": "ERROR",
  "timestamp": "2018-02-09T12:00:00.003Z",
  "message": "Error",
  "_data": {
    "pid": 10000,
    "info": {
      "some": "data"
    },
    "data": {
      "some": "data"
    }
  }
}
```

### Многострочный стектрейс
Иногда в логи могут валиться стектрейсы ошибок. В таком случае, нужно выцепить весь стектрейс и преобразовать его в строку.
Т. к. дата и время для стектрейсов неизвестны, в поле `timestamp` следует подставить значение от предыдущей записи, при её наличии.

Пример преобразования стектрейса:
```
// In:
BadRequestError: request aborted
    at emitNone (events.js:105:13)
    at IncomingMessage.emit (events.js:207:7)
    at abortIncoming (_http_server.js:410:9)
    at socketOnClose (_http_server.js:404:3)
    at emitOne (events.js:120:20)
    at Socket.emit (events.js:210:7)
    at TCP._handle.close [as _onclose] (net.js:547:12)

// Out:
{
  "type": "ERROR",
  "timestamp": "2018-02-09T12:00:00.003Z",
  "message": "BadRequestError: request aborted | at emitNone (events.js:105:13) | at IncomingMessage.emit (events.js:207:7) | at abortIncoming (_http_server.js:410:9) | at socketOnClose (_http_server.js:404:3) | at emitOne (events.js:120:20) | at Socket.emit (events.js:210:7) | at TCP._handle.close [as _onclose] (net.js:547:12)",
}
```
