import React from 'react';
import { Input, Button, Table } from 'antd';
import { IoMdAlarm } from "react-icons/io";
const { Search } = Input;

export default function Storage() {

  const onSearch = (value, _e, info) => console.log(info?.source, value);

  const dataSource = [
    {
      key: '1',
      name: 'Mike',
      age: 32,
      address: '10 Downing Street',
    },
    {
      key: '2',
      name: 'John',
      age: 42,
      address: '10 Downing Street',
    },
  ];
  
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Age',
      dataIndex: 'age',
      key: 'age',
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
    },
  ];

  return (
    <div>
      <ul>
        <li className='flex gap-x-3 justify-between items-center'>
        <Search placeholder="Search" className='w-[40%]' onSearch={onSearch} enterButton/>
        <span className='flex gap-x-3 justify-center items-center'>
        <Button>Material List / Product List</Button>
          <Button type="primary">Set Alert <IoMdAlarm /></Button>
        </span>
        </li>
        <li className='mt-2'>
        <Table dataSource={dataSource} columns={columns} pagination={false}/>;
        </li>
      </ul>
    </div>
  )
}
