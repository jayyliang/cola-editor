import React, { useEffect } from 'react'
import { Button, Form, Input, message } from 'antd'
import { UPLOAD_CONFIG } from '../../../../utils/upload'
const Item = Form.Item
const Setting = () => {
  const [form] = Form.useForm()
  useEffect(() => {
    let config = window.localStorage.getItem(UPLOAD_CONFIG) || '{}'
    try {
      config = JSON.parse(config)
      form.setFieldsValue(config)
    } catch (error) {
      form.setFieldsValue({})
    }
  }, [])
  const save = async () => {
    const values = await form.validateFields()
    window.localStorage.setItem(UPLOAD_CONFIG, JSON.stringify(values))
    message.success('保存成功')
  }
  return (
    <div style={{ margin: 20 }}>
      <Form form={form}>
        <Item
          label="token"
          name="token"
          rules={[
            {
              required: true,
              message: '请输入${label}'
            }
          ]}
        >
          <Input />
        </Item>
        <Item
          label="用户名"
          name="owner"
          rules={[
            {
              required: true,
              message: '请输入${label}'
            }
          ]}
        >
          <Input />
        </Item>
        <Item
          label="仓库名"
          name="repo"
          rules={[
            {
              required: true,
              message: '请输入${label}'
            }
          ]}
        >
          <Input />
        </Item>
      </Form>
      <Button type="primary" onClick={save}>
        保存
      </Button>
    </div>
  )
}

export default Setting
