// src/components/NavBar.js
import React, {useState} from 'react';
import IceCreamLogo from '../assets/img/33456902_6600_7_04.jpg'
import { LiaHandHoldingUsdSolid } from "react-icons/lia";
import { TbIceCream } from "react-icons/tb";
import { Modal, Button, Input, Form, InputNumber, Select, DatePicker } from 'antd';
const { TextArea } = Input;
import dayjs from 'dayjs';

export default function NavBar({ navPages,setNavPages }) {

  const [isQuickSaleModalOpen, setIsQuickSaleModalOpen] = useState(false);
  const [isSpendingModalOpen, setIsSpendingModalOpen] = useState(false);
  const [quickSaleForm] = Form.useForm();
  const [spendingForm] = Form.useForm();
  const [form] = Form.useForm();

  const handleQuickSaleFinish = (values) => {
    console.log('Quick Sale Data:', values);
    setIsQuickSaleModalOpen(false);
    quickSaleForm.resetFields();
  };

  const handleSpendingFinish = (values) => {
    console.log('Spending Data:', values);
    setIsSpendingModalOpen(false);
    spendingForm.resetFields();
  };

  return (
    <nav className='border-r-2 h-screen col-span-2 relative'>
      <ul>
       <li className='flex flex-col justify-center items-center gap-y-1 my-8'><img className='w-14 rounded-full' src={IceCreamLogo}/><span className='font-medium text-[0.9rem]'>Ice Cream</span></li>
        {navPages.pages.map((page, i) => (
            <li key={i} className={`${page === navPages.currentpage ? 'text-white bg-blue-500 rounded-r-full':''} cursor-pointer px-2 py-2 flex items-center gap-x-2`} onClick={() => setNavPages(pre =>({...pre,currentpage:page,pagecount:i}))}>
                <span >{navPages.icons[i]}</span>
                <span>{page}</span>
            </li>
        ))}
      </ul>
      <Button className='flex justify-center items-center gap-x-2 bg-blue-500 text-white p-1 w-[95%] rounded-md absolute bottom-16 left-1/2 -translate-x-1/2 cursor-pointer hover:bg-blue-400' onClick={() => {setIsQuickSaleModalOpen(true); quickSaleForm.resetFields();}}><TbIceCream size={25}/><span>Quick Sale</span></Button>
      <Button className='flex justify-center items-center gap-x-2 bg-blue-500 text-white p-1 w-[95%] rounded-md absolute bottom-5 left-1/2 -translate-x-1/2 cursor-pointer hover:bg-blue-400' onClick={() => { setIsSpendingModalOpen(true); spendingForm.resetFields(); }}><LiaHandHoldingUsdSolid size={25}/><span>Spending</span></Button>
    
      <Modal
        title={<div className='flex  justify-center py-3'> <h1>QUICK SALE</h1> </div>}
        open={isQuickSaleModalOpen}
        onOk={() => quickSaleForm.submit()}
        onCancel={() => { 
          setIsQuickSaleModalOpen(false); 
          quickSaleForm.resetFields(); 
        }}
        >

        <Form
          form={quickSaleForm}
          layout="vertical"
          onFinish={handleQuickSaleFinish}
          initialValues={{ date: dayjs() }}
        >
          <Form.Item
            name="productName"
            label="Product"
            rules={[{ required: true, message: 'Please input the product name!' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="productName"
            label="Flavour"
            rules={[{ required: true, message: 'Please input the product name!' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="quantity"
            label="Quantity"
            rules={[{ required: true, message: 'Please input the quantity!' }]}
          >
            <InputNumber min={1} className="w-full" />
          </Form.Item>

          {/* <Form.Item
            name="unit"
            label="Unit"
            rules={[{ required: true, message: 'Please select the unit!' }]}
          >
            <Select>
              <Select.Option value="pcs">Pieces</Select.Option>
              <Select.Option value="kg">Kilograms</Select.Option>
              <Select.Option value="ltr">Liters</Select.Option>
            </Select>
          </Form.Item> */}

          <Form.Item
            name="price"
            label="Count"
            rules={[{ required: true, message: 'Please input the price!' }]}
          >
            <InputNumber min={0} className="w-full" />
          </Form.Item>

          <Form.Item className='mb-3 absolute top-8' name='date' label="" rules={[{ required: true, message: false }]}>
          <DatePicker  format={"DD/MM/YY"} />
          </Form.Item>

          <Form.Item
            name="price"
            label="Price"
            rules={[{ required: true, message: 'Please input the price!' }]}
          >
            <InputNumber min={0} className="w-full" />
          </Form.Item>

        </Form>
      </Modal>

      <Modal
        title={<div className='flex  justify-center py-3'> <h1>SPENDING</h1> </div>}
        open={isSpendingModalOpen}
        onOk={() => spendingForm.submit()}
        onCancel={() => { 
          setIsSpendingModalOpen(false); 
          spendingForm.resetFields(); 
        }}
      >
        <Form
          form={spendingForm}
          layout="vertical"
          onFinish={handleSpendingFinish}
          initialValues={{ date: dayjs() }}
        >
   
         <Form.Item className='mb-3 absolute top-8' name='date' label="" rules={[{ required: true, message: false }]}>
          <DatePicker  format={"DD/MM/YY"} />
          </Form.Item>

          <Form.Item
            name="category"
            label="Person"
            rules={[{ required: true, message: 'Please select the category!' }]}
          >
            <Select>
              <Select.Option value="Owner">Owner</Select.Option>
              <Select.Option value="Employee">Employee</Select.Option>
              <Select.Option value="Other">Other</Select.Option>
            </Select>
          </Form.Item>

          
          <Form.Item
            name="amount"
            label="Amount"
            rules={[{ required: true, message: 'Please input the amount!' }]}
          >
            <InputNumber min={0} className="w-full" />
          </Form.Item>

          <Form.Item
            name="expenseName"
            label="Description"
            rules={[{ required: true, message: 'Please input the expense name!' }]}
          >
            <TextArea rows={4} />
          </Form.Item>

        </Form>
      </Modal>
    </nav>
  );
}
