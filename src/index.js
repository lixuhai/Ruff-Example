'use strict';
var fetch = require('fetch');
var config = require('../config.json');

// 监控变量
var illuminance = 0;
var temperature = 0;
var humidity = 0;

//采集任务时差
var collect_interval = config.collect_interval;

// 上传任务时差
var upload_interval = config.upload_interval;

function red_blink() {
    $('#led-r').turnOn();
    setTimeout(function() {
        $('#led-r').turnOff();
    }, 500);
}

function green_blink() {
    $('#led-g').turnOn();
    setTimeout(function() {
        $('#led-g').turnOff();
    }, 500);
}

function blue_blink() {
    $('#led-b').turnOn();
    setTimeout(function() {
        $('#led-b').turnOff();
    }, 500);
}

function get_illuminance() {
    $('#lightSensor').getIlluminance(function(error, value) {
        $('#lcd').setCursor(12, 1);
        if (error) {
            console.error(error);
            $('#lcd').print(illuminance + '');
            green_blink();
            return;
        }
        console.log('[update] illuminance:', value);
        $('#lcd').print(value + '');
        illuminance = value;
    });
}

function get_relative_humidity() {
    $('#thSensor').getRelativeHumidity(function(error, value) {
        $('#lcd').setCursor(4, 0);
        if (error) {
            console.error(error);
            $('#lcd').print(humidity + '');
            blue_blink();
            return;
        }
        console.log('[update] humidity:', value);
        $('#lcd').print(value + '');
        humidity = value;
    });
}

function get_temperature() {
    $('#thSensor').getTemperature(function(error, value) {
        $('#lcd').setCursor(13, 0);
        if (error) {
            console.error(error);
            $('#lcd').print(temperature + '');
            red_blink();
            return;
        }
        console.log('[update] temperature:', value);
        $('#lcd').print(value + '');
        temperature = value;
    });
}

function post_data() {
    $('#led-g').turnOn();
    console.log('[upload] data post begin');
    var data = {
        'illuminance': illuminance,
        'temperature': temperature,
        'humidity': humidity,
    };
    fetch(config.server_url, {
        method: 'POST',
        headers: {
            'Connection': 'keep-alive',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
        },
        body: JSON.stringify(data),
    }).then(function() {
        $('#led-g').turnOff();
        console.log('[upload] data post finished');
    });
}

function init_screen() {
    $('#lcd').clear(function() {
        console.log('[status] LCD CLEARED AND WAITING');
    });
    $('#lcd').setCursor(0, 0);
    $('#lcd').print("wet:--");
    $('#lcd').setCursor(6, 0);
    $('#lcd').print(", temp:--");
    $('#lcd').setCursor(0, 1);
    $('#lcd').print("illuminance:--");
}

function clear_number() {
    $('#lcd').setCursor(4, 0);
    $('#lcd').print("  ");
    $('#lcd').setCursor(13, 0);
    $('#lcd').print("   ");
    $('#lcd').setCursor(12, 1);
    $('#lcd').print("    ");
}

$.ready(function(error) {
    if (error) {
        console.log(error);
        return;
    }

    // 数据展示
    init_screen();

    // 开启数据采集
    setInterval(function() {
        clear_number();
        get_illuminance();
        get_temperature();
        get_relative_humidity();
    }, collect_interval);

    // 定时型数据发送
    setInterval(function() {
        post_data();
    }, upload_interval);

    // 主动型数据发送
    $('#btn').on('push', function() {
        console.log('[status] button pushed.');
        post_data();
    });
});

// 关机任务
$.end(function() {
    $('#led-r').turnOff();
    $('#led-g').turnOff();
    $('#led-b').turnOff();
});