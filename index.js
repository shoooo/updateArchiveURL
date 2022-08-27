const mongoose = require('mongoose');
const moment = require('moment');
const https = require('https');
const Lesson = require("./models/Lesson");
require('dotenv').config();

// const event = {
//     "version": "0",
//     "id": "12345678-1a23-4567-a1bc-1a2b34567890",
//     "detail-type": "IVS Recording State Change",
//     "source": "aws.ivs",
//     "account": "123456789012",
//     "time": "2020-06-23T20:12:36Z",
//     "region": "us-west-2",
//     "resources": [
//         "arn:aws:ivs:us-west-2:123456789012:channel/AbCdef1G2hij"
//     ],
//     "detail": {
//         "channel_name": "6290633961a6e66d5cefd631",
//         "stream_id": "st-1F6jDj0t3zV01cXKe5dScIJ",
//         "recording_status": "Recording Start",
//         "recording_status_reason": "",
//         "recording_s3_bucket_name": "r2s3-dev-channel-1-recordings",
//         "recording_s3_key_prefix": "ivs/v1/401352423179/M6ewDPM4oNmV/2022/6/6/13/35/pH4G1lWzUHzv"
//     }
// }

exports.handler = (event, context) => {
    // const createArchive = async () => {
    mongoose.connect("mongodb+srv://readwrite:ekI8bBap8X5qvl42@vibin.e6scb.mongodb.net/Vibin-dev?retryWrites=true&w=majority")
    const jsonURL = `https://vibin-archive.s3.amazonaws.com/${event.detail.recording_s3_key_prefix}/events/recording-ended.json`
    const archiveURL = `https://vibin-archive.s3.amazonaws.com/${event.detail.recording_s3_key_prefix}/media/hls/master.m3u8`

    // get json which is created when a recording is ended
    https.get(jsonURL, res => {
        res.on('data', (chunk) => {
            // get the json contents
            const json = JSON.parse(chunk)
            console.log(json);
            const duration = moment.utc(json.media.hls.duration_ms).format("HH:mm:ss");

            // slice the recording time to get the date only
            const date = json.recording_started_at.substring(0, json.recording_started_at.indexOf('T'))
            console.log(duration);

            // find a lesson with a start-time 5 mins before or after a recording start-time
            // in order to avoid huge search, search by choreographer ID AND date

            Lesson.find({
                $and: [
                    { choreographerID: event.detail.channel_name },
                    { "time.start": { "$regex": date, "$options": "i" } }
                ]
            }, (err, lessons) => {
                console.log(lessons)
                if (lessons) {
                    lessons.forEach(lesson => {
                        // find if any of the choreographer's lesson start 5 mins before or after the recording start-time
                        const subFive = moment(lesson.time.start).subtract(5, 'm').format()
                        const addFive = moment(lesson.time.start).add(5, 'm').format()

                        // get local time because the json time is in UTC
                        const archiveTime = moment(json.recording_started_at).utcOffset('+09:00').format('YYYY-MM-DDTHH:mm:ss');
                        const isWithin = moment(archiveTime).isBetween(subFive, addFive)

                        // if found, archive info is stored in the lesson model 
                        if (isWithin === true) {
                            const update = {
                                s3: {
                                    archiveURL: archiveURL,
                                    duration: duration,
                                }
                            }

                            Lesson.updateOne({ _id: lesson._id } ,update, (err, updated) => {
                                return updated;
                            });
                        } else {
                            return "No Lessons happening in the right time, delete archive";
                        }
                    });
                } else {
                    // if not found, recording is deleted
                    return "No Lessons found, delete archive";
                }
            })
        });
    })
}

// createArchive()