'use strict';
const http = require('http');
const Influx = require('influxdb-nodejs');
const config = require('../../config.json');
const client = new Influx(config.influx_url);

// 数据库配置
const fieldSchema = {
    illuminance: 'i',
    temperature: 'i',
    humidity: 'i',
};
const tagSchema = {
    period: ['work', 'non-work']
};
client.schema('status', fieldSchema, tagSchema, {
    // default is false 
    stripUnknown: true,
});

// 存储函数
function store_influxdb(data) {
    var current_monent = new Date();
    var current_status = JSON.parse(data);
    var current_period = (current_monent.getHours() >= 9 && current_monent.getHours() <= 18) ? "work" : "non-work";
    client.write('status')
        .tag({
            period: current_period
        })
        .field({
            illuminance: current_status.illuminance,
            temperature: current_status.temperature,
            humidity: current_status.humidity
        })
        .then(() => {
            console.log('[' + new Date().toLocaleString() + '] STORE DATA SUCCEED');
        })
        .catch(console.error);
}

var server = http.createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    res.setHeader("Content-Type", "application/json;charset=utf-8");

    if (req.method == 'POST' && req.url.indexOf('/officeStatus') == 0) {
        // 获取请求内容
        var data = '';
        var content = {
            ip: req.socket.remoteAddress,
            port: req.socket.remotePort,
            body: data
        };

        req.on('data', (chunk) => {
            data += chunk;
        });

        req.on('end', () => {
            console.log("[" + new Date().toLocaleString() + "]" + " POST DATA RECEIVED: " + data);
            content.body = data;
            store_influxdb(data);
            res.end(JSON.stringify(content));
        });
    } else {
        res.end('404 NOT FOUND');
    }
});

process.on("uncaughtException", function(e) {
    console.log("[" + new Date().toLocaleString() + "][ERROR] uncaughtException: " + e);
});

server.listen(config.port, config.port);