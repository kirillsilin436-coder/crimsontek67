<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CRIMSONTEK // PHONE_SCAN</title>
    <style>
        body { background: #000; color: #ff0000; font-family: monospace; padding: 20px; text-transform: uppercase; }
        .terminal { border: 1px solid #f00; padding: 15px; background: #050000; height: 300px; overflow-y: auto; margin-bottom: 15px; font-size: 12px; }
        input { background: #000; border: 1px solid #f00; color: #fff; padding: 10px; width: 70%; outline: none; }
        button { background: #f00; color: #000; border: none; padding: 10px; font-weight: bold; cursor: pointer; }
        .back { display: block; margin-top: 20px; color: #888; text-decoration: none; font-size: 10px; }
    </style>
</head>
<body>
    <h3>[ MODULE: PHONE_SCANNER ]</h3>
    <div class="terminal" id="out">/ ОЖИДАНИЕ ВВОДА НОМЕРА...</div>
    <input type="text" id="num" placeholder="+77000000000">
    <button onclick="scan()">SCAN</button>
    <a href="dashboard.html" class="back">&lt;-- BACK_TO_HUB</a>

    <script>
        function scan() {
            const out = document.getElementById('out');
            const num = document.getElementById('num').value;
            if(!num) return;
            out.innerHTML += `<br>> INITIALIZING SCAN: ${num}...`;
            setTimeout(() => { out.innerHTML += `<br>> ПОИСК В БАЗАХ ДАННЫХ...`; }, 1000);
            setTimeout(() => { out.innerHTML += `<br>> СТАТУС: АКТИВЕН. РЕГИОН: КАЗАХСТАН.`; }, 2500);
            setTimeout(() => { out.innerHTML += `<br><span style="color:#0f0">> ГОТОВО. ДАННЫЕ ОТПРАВЛЕНЫ В ОСНОВНОЙ ТЕРМИНАЛ.</span>`; }, 4000);
        }
    </script>
</body>
</html>
