"use strict"
import { config } from '../../src/webpack/config';
import { TruncateDB } from '../../util/truncatedb';
import { secret } from '../lib/secret';

const axios = require('axios')
let entry_point: string;
beforeAll(async () => {
  entry_point = `https://${config.apiGateway.restApiId}.execute-api.${config.region}.amazonaws.com/dev`;
  console.log(entry_point)
  await TruncateDB.truncate()
});

describe('get Centers', () => {
  it('raise 404 error when there is no data', async () => {
    expect.assertions(1);
    const t = async () => {
      console.log(entry_point + '/api/admin/center');
      const ret = await axios.get(entry_point + '/api/admin/center');
      return ret;
    }
    await expect(t).rejects.toThrow(/*404*/);
  })
})

describe('admin user login', () => {
  it('get Authkey', async () => {
    expect.assertions(1);
    console.log(entry_point + '/api/admin/login')
    const ret = await axios.post(entry_point + '/api/admin/login', { username: secret.auth_user, password: secret.auth_pass });
    expect(ret.data).toHaveProperty('idToken')
  })
})


describe('admin user', () => {
  let axios_admin: any;
  let center_id: string;
  let center_id2: string;
  let nurse_id: string;
  let nurse_item: any;
  beforeAll(async () => {
    console.log('login as an admin')
    const ret = await axios.post(entry_point + '/api/admin/login', { username: secret.auth_user, password: secret.auth_pass });
    const idToken = ret.data.idToken;
    axios_admin = axios.create({
      headers: {
        Authorization: idToken
      }
    })
  });

  it('create new center', async () => {
    const ret = await axios_admin.post(entry_point + '/api/admin/center', { centerName: 'A保健所' });
    expect(ret.data).toHaveProperty('centerId')
    center_id = ret.data.centerId;
  })

  it('read new center id', async () => {
    const ret = await axios_admin.get(entry_point + `/api/admin/center/${center_id}`);
    expect(ret.data.centerName).toBe('A保健所')
  })

  it('update existing center', async () => {
    const ret = await axios_admin.put(entry_point + `/api/admin/center/${center_id}`, { centerName: 'C保健所' });
    expect(ret.data.centerName).toBe('C保健所')
  })

  it('create another center', async () => {
    const ret = await axios_admin.post(entry_point + '/api/admin/center', { centerName: 'B保健所' });
    expect(ret.data).toHaveProperty('centerId')
    center_id2 = ret.data.centerId;
  })

  it('get two centers', async () => {
    const ret = await axios_admin.get(entry_point + '/api/admin/center');
    expect(ret.data.Count).toBe(2)
    expect(ret.data.Items).toHaveLength(2)
  })

  it.skip('create new nurse to the center', async () => {
    const ret = await axios_admin.post(entry_point + `/api/admin/center/${center_id}`, { nurseId: 'nurseA' });
    expect(ret.data).toHaveProperty('nurseId')
    expect(ret.data.manageCenters).toEqual(expect.arrayContaining(expect.objectContaining({ centerId: center_id })))
    nurse_id = 'nurseA'
  })

  it.skip('read new nurse id', async () => {
    pending
    const ret = await axios_admin.get(entry_point + `/api/admin/nurse/${nurse_id}`);
    expect(ret.data.manageCenters).toEqual(expect.arrayContaining(expect.objectContaining({ centerId: center_id })))
  })

  it.skip('create another nurse', async () => {
    pending
    const ret = await axios_admin.post(entry_point + `/api/admin/center/${center_id}`, { nurseId: 'nurseB' });
    expect(ret.data).toHaveProperty('nurseId')
    expect(ret.data.manageCenters).toEqual(expect.arrayContaining(expect.objectContaining({ centerId: center_id })))
    nurse_item = ret.data
  })

  it.skip('get two nurses', async () => {
    pending
    const ret = await axios_admin.get(entry_point + `/api/admin/center/${center_id}/nurse`);
    expect(ret.data.Count).toBe(2)
    expect(ret.data.Items).toHaveLength(2)
  })
  it.skip('update existing nurse', async () => {
    nurse_item.manageCenters[0].centerId = center_id2
    const ret = await axios_admin.put(entry_point + `/api/admin/center/${center_id}`, nurse_item);
    expect(ret.data.manageCenters[0].centerName).toBe('B保健所')
  })

})