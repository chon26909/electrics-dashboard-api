import { Request, Response } from "express";
import Electric from "../models/Electric.model";
import * as  socket from './socketio';

export const refreshPerMinute = (minute: number) => {

    setInterval(async () => {
        const data_all = await Electric.find();

        let today = new Date();
        const data_today = data_all.filter((item) => {

            if (new Date(item.date).getDate() === today.getDate()) return {
                ...item
            }
        })

        const data_watt_today = calulateWattPerMinute(data_today);
        const unit_today = calulateWattPerHour(data_watt_today).toFixed(2);

        const data_watt_all = calulateWattPerMinute(data_all);
        const unit_all = calulateWattPerHour(data_watt_all).toFixed(2);
        socket.emit('update_unit',{ today: unit_today, all: unit_all });
    }, minute * 60 * 1000);
}

export const getElectrics = async (req: Request, res: Response) => {

    const name = req.query.name;

    let data_all = [];

    if (name) {
        data_all = await Electric.find({ name });
    }
    else {
        data_all = await Electric.find();
    }

    let today = new Date();
    const data_today = data_all.filter((item) => {

        if (new Date(item.date).getDate() === today.getDate()) return {
            ...item
        }
    })

    // const data_watt_today = calulateWattPerMinute(data_today);
    // const unit_today = calulateWattPerHour(data_watt_today).toFixed(2);

    const data_watt_all = calulateWattPerMinute(data_all);
    const unit_all = calulateWattPerHour(data_watt_all).toFixed(2);
    res.status(200).json({ today: 0, all: unit_all });
}

const calulateWattPerMinute = (data: any) => {
    // const data = [{ "name": "fan", "watt": 40.7, "date": "2022-06-18T05:18:23.679Z" }, { "name": "air", "watt": 220, "date": "2022-06-18T05:18:23.897Z" }, { "name": "fan", "watt": 40.7, "date": "2022-06-18T05:18:28.680Z" }, { "name": "air", "watt": 220, "date": "2022-06-18T05:18:28.902Z" }, { "name": "fan", "watt": 40.7, "date": "2022-06-18T05:18:33.694Z" }, { "name": "air", "watt": 220, "date": "2022-06-18T05:18:33.942Z" }, { "name": "fan", "watt": 40.7, "date": "2022-06-18T05:18:38.703Z" }, { "name": "air", "watt": 220, "date": "2022-06-18T05:18:38.929Z" }, { "name": "fan", "watt": 40.7, "date": "2022-06-18T05:18:43.703Z" }, { "name": "air", "watt": 220, "date": "2022-06-18T05:18:43.926Z" }, { "name": "fan", "watt": 40.7, "date": "2022-06-18T05:18:48.704Z" }, { "name": "air", "watt": 220, "date": "2022-06-18T05:18:48.930Z" }, { "name": "fan", "watt": 40.7, "date": "2022-06-18T05:18:53.720Z" }, { "name": "air", "watt": 220, "date": "2022-06-18T05:18:53.944Z" }, { "name": "fan", "watt": 40.7, "date": "2022-06-18T05:18:58.713Z" }, { "name": "air", "watt": 220, "date": "2022-06-18T05:18:58.934Z" }, { "name": "fan", "watt": 40.7, "date": "2022-06-18T05:19:03.727Z" }, { "name": "air", "watt": 220, "date": "2022-06-18T05:19:03.947Z" }, { "name": "fan", "watt": 40.7, "date": "2022-06-18T05:19:08.737Z" }, { "name": "air", "watt": 220, "date": "2022-06-18T05:19:08.962Z" }, { "name": "fan", "watt": 40.7, "date": "2022-06-18T05:19:13.753Z" }, { "name": "air", "watt": 220, "date": "2022-06-18T05:19:13.982Z" }, { "name": "fan", "watt": 40.7, "date": "2022-06-18T05:19:18.764Z" }, { "name": "air", "watt": 220, "date": "2022-06-18T05:19:18.992Z" }, { "name": "fan", "watt": 40.7, "date": "2022-06-18T05:19:23.768Z" }, { "name": "air", "watt": 220, "date": "2022-06-18T05:19:23.990Z" }, { "name": "fan", "watt": 40.7, "date": "2022-06-18T05:19:28.785Z" }, { "name": "air", "watt": 220, "date": "2022-06-18T05:19:29.007Z" }]

    const ruduceData = data.map((item: any) => {
        return {
            name: item.name,
            watt: item.watt,
            date: new Date(item.date).toLocaleString('th-TH', {
                // weekday: 'long', // long, short, narrow
                day: 'numeric', // numeric, 2-digit
                year: 'numeric', // numeric, 2-digit
                month: 'numeric', // numeric, 2-digit, long, short, narrow
                hour: 'numeric', // numeric, 2-digit
                minute: 'numeric', // numeric, 2-digit
                // second: 'numeric', // numeric, 2-digit
            })
        }
    })
        .reduce((buffer: any, item: any) => {



            if (buffer[item.date]) {
                buffer[item.date].data.push(item);
                buffer[item.date].watt += item.watt;
            }
            else {
                buffer[item.date] = { watt: 0, data: [] }
                buffer[item.date].data = [item];
                buffer[item.date].watt = item.watt;

            }

            return buffer;
        }, {})


    console.log('ruduceData', ruduceData);



    const wattPerMinute = Object.keys(ruduceData).map((key, i) => {

        let sum_watt = 0;

        const item = ruduceData[key];

        const _result = item.data.reduce((element: any, _item: any) => {

            if (element[_item.name]) {
                element[_item.name].watt += _item.watt;
                element[_item.name].count++;
            }
            else {
                element[_item.name] = { watt: 0, count: 0 }
                // element[item.date].data = [item];
                // element[item.date].watt = item.watt;
            }

            return element;
        }, {})

        console.log(i, _result);

        Object.keys(_result).map((j: any) => {
            sum_watt += _result[j].watt / _result[j].count;
        })

        // console.log('sum_watt', sum_watt);

        return {
            date: key,
            watt: Number(sum_watt.toFixed(2))
        }
    })

    // console.log("wattPerMinute : ", wattPerMinute);


    return wattPerMinute;
}

const calulateWattPerHour = (data: any[]) => {
    // console.log('data', data);

    const data_watt = data.reduce((element, curr) => {
        // total.sum_watt += Number(curr.watt);
        // return total;
        if (element[curr.watt]) {
            // element[_item.name].watt += _item.watt;
            // element[_item.name].count++;
            element[curr.watt] += 1;
        }
        else {
            element[curr.watt] = 1
            // element[item.date].data = [item];
            // element[item.date].watt = item.watt;
        }

        return element;

    }, {})

    // console.log(data_watt);

    const sum_unit = Object.keys(data_watt).map((w) => {
        const _watt = Number(w) / 1000;
        const _minute = data_watt[w] / 60;
        return _watt * _minute;
    }).reduce((a, b) => a + b, 0);

    console.log('unit', sum_unit);

    return sum_unit;
}