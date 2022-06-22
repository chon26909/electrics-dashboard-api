import { Request, Response } from "express";
import Electric from "../models/Electric.model";
import * as  socket from './socketio';

export const refreshPerMinute = (minute: number) => {

    setInterval(async () => {
        const data = await Electric.find();

        const res_data = calculateElectricConsumption(data);

        socket.emit('update_dashboard', res_data);

    }, minute * 60 * 1000);
}

export const getElectrics = async (req: Request, res: Response) => {

    const name = req.query.name;

    let data = [];

    if (name) {
        data = await Electric.find({ name });
    }
    else {
        data = await Electric.find();
    }

    const res_data = calculateElectricConsumption(data);
    console.log('response data ', res_data);
    res.status(200).json(res_data);
}

const calculateElectricConsumption = (data: any[]) => {
    // filter data at today
    const data_today = data.filter((item) => {
        if (new Date(item.date).getDate() === new Date().getDate()) return { ...item }
    })

    // group by electrical appliances such as 
    // - fan
    // - air
    // - television
    const groupbyElectricalAppliances = data_today.reduce((buffer: any, item: any) => {
        if (buffer[item.name]) {
            buffer[item.name].push(item)
        }
        else {
            buffer[item.name] = [item]
        }
        return buffer;
    }, {})


    // console.log('group by electrical appliances', groupbyElectricalAppliances);

    let unit_consumption_electrical_appliances: any[] = [];

    Object.keys(groupbyElectricalAppliances).map((key) => {
        const item = groupbyElectricalAppliances[key];
        const data_watt_today = calculateWattPerMinute(item);
        const unit_today = calulateWattPerHour(data_watt_today).toFixed(2);
        unit_consumption_electrical_appliances.push({ name: key, unit: unit_today });
    })

    // today 
    const unit_consumption_today = unit_consumption_electrical_appliances.reduce((sum, item) => {
        sum = item.unit;
        return sum;
    }, 0)
    const CO2Emission_today = calculateCO2(unit_consumption_today);
    const price_today = calculateUnitToPrice(unit_consumption_today);

    // month
    const data_watt_all = calculateWattPerMinute(data);
    const unit_consumption_month = Number(calulateWattPerHour(data_watt_all));
    const CO2Emission_month = calculateCO2(unit_consumption_month);
    const price_month = calculateUnitToPrice(unit_consumption_month);

    const res_data = {
        today: {
            unit: Number(unit_consumption_today).toFixed(2),
            unit_per_electric: unit_consumption_electrical_appliances,
            co2: Number(CO2Emission_today).toFixed(2),
            price: Number(price_today).toFixed(2)
        },
        month: {
            unit: Number(unit_consumption_month).toFixed(2),
            co2: Number(CO2Emission_month).toFixed(2),
            price: Number(price_month).toFixed(2)
        }
    }

    return res_data;
}

const calculateWattPerMinute = (data: any) => {

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
                buffer[item.date].watt_data.push(item.watt);
                // buffer[item.date].watt += item.watt;
            }
            else {
                buffer[item.date] = { watt_data: [] }
                buffer[item.date].watt_data = [item.watt];
                // buffer[item.date].watt = item.watt;

            }

            return buffer;
        }, {})


    // console.log('watt per minute ', ruduceData);


    //mean watt per minute
    const wattPerMinute = Object.keys(ruduceData).map((key, i) => {

        // let sum_watt = 0;

        const item = ruduceData[key];

        // const _result = item.watt_data.reduce((element: any, _item: any) => {

        //     if (element[_item.name]) {
        //         element[_item.name].watt += _item.watt;
        //         element[_item.name].count++;
        //     }
        //     else {
        //         element[_item.name] = { watt: 0, count: 0 }
        //         // element[item.date].data = [item];
        //         // element[item.date].watt = item.watt;
        //     }

        const _sum_watt_per_minute = item.watt_data.reduce((total: number, _item: any) => {
            total += _item;
            return total;
        }, 0)

        //     return element;
        // }, {})



        const mean_watt = _sum_watt_per_minute / item.watt_data.length;

        // console.log(key, mean_watt);

        // Object.keys(_result).map((j: any) => {
        //     sum_watt += _result[j].watt / _result[j].count;
        // })

        // console.log('sum_watt', sum_watt);

        return {
            date: key,
            watt: Number(mean_watt.toFixed(2))
        }
    })

    // console.log("wattPerMinute : ", wattPerMinute);


    return wattPerMinute;
}

const calulateWattPerHour = (data: any[]) => {

    const watt_per_minute = data.reduce((element, curr) => {
        if (element[curr.watt]) {
            element[curr.watt] += 1;
        }
        else {
            element[curr.watt] = 1
        }
        return element;
    }, {})

    console.log("watt_per_minute ", watt_per_minute);

    const sum_unit = Object.keys(watt_per_minute).map((w) => {
        const _watt = Number(w) / 1000;
        const _minute = watt_per_minute[w] / 60;
        return _watt * _minute;
    }).reduce((a, b) => a + b, 0);

    // console.log('unit', sum_unit);

    return sum_unit;
}

const calculateUnitToPrice = (unit: number): number => {
    if (unit <= 15) {
        return unit * 2.3488;
    }
    else if (unit >= 16 && unit <= 25) {
        return unit * 2.9882;
    }
    else if (unit >= 26 && unit <= 35) {
        return unit * 3.2405;
    }
    else if (unit >= 36 && unit <= 100) {
        return unit * 3.6237;
    }
    else if (unit >= 101 && unit <= 150) {
        return unit * 3.7171;
    }
    else if (unit >= 151 && unit <= 400) {
        return unit * 4.2218;
    }
    else if (unit > 400) {
        return unit * 4.4217;
    }
    else {
        return 0
    }
}

const calculateCO2 = (unit: number): number => {
    const kgCO2e = 0.5610;
    return unit * kgCO2e;
}