import { InboxOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Form,
  Input,
  message,
  Modal,
  Select,
  type UploadProps,
} from "antd";
import Dragger from "antd/es/upload/Dragger";
import { main_endpoint, upload_endpoint } from "./erva";
import { useState } from "react";
import type { formPostData } from "./atualizar";
import { getNewTokenIfExpired } from "../../util";

export function Adicionar() {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [modeManual, setManualMode] = useState(true);
  const [creating, setCreating] = useState(false);
  const tabs = [
    {
      key: "manual",
      tab: "Manualmente",
    },
    {
      key: "csv",
      tab: "Via csv",
    },
  ];

  const createHerb = async (data: formPostData) => {
    try {
      await getNewTokenIfExpired();
      setCreating(true);
      let sent = undefined;
      if (data.description) sent = data;
      else {
        sent = {
          name: data.name,
          category: data.category,
        };
      }

      const request = await fetch(main_endpoint, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sent),
      });

      if (request.ok) {
        messageApi.open({
          type: "success",
          content: "Erva adicionada",
        });

        form.resetFields();
        setCreating(false);
        return;
      }

      const err_msg = await request.json();
      if (err_msg.errors.name) {
        form.setFields([
          {
            name: "name",
            errors: [String(err_msg.errors.name)],
          },
        ]);

        return;
      } else {
        throw new Error();
      }
    } catch (e) {
      messageApi.open({
        type: "error",
        content: "Tente novamente mais tarde",
      });
      console.log(e);
    } finally {
      setCreating(false);
    }
  };

  const [errorModal, setErrorModal] = useState<string | null>("");

  const renderPopup = () => {
    return (
      <Modal
        open={!!errorModal}
        onOk={() => setErrorModal(null)}
        onCancel={() => setErrorModal(null)}
        title="Erro"
      >
        {errorModal}
      </Modal>
    );
  };

  const renderCard = () => {
    if (modeManual) {
      return (
        <Form
          layout="vertical"
          onFinish={createHerb}
          name="postForm"
          form={form}
        >
          <Form.Item<formPostData>
            label="Nome"
            name="name"
            rules={[
              {
                required: true,
                message: "Forneça um nome",
              },
              {
                max: 30,
                message: "Nome não deve exceder 30 caracteres",
              },
            ]}
          >
            <Input placeholder="Manjericão" />
          </Form.Item>

          <Form.Item<formPostData>
            required
            label="Categoria"
            name="category"
            initialValue="aromática"
          >
            <Select
              placeholder="Selecione a caregoria"
              options={[
                { label: "Aromática", value: "aromática" },
                { label: "Culinária", value: "culinaria" },
                { label: "Medicinal", value: "medicinal" },
                { label: "Outra", value: "outro" },
              ]}
            />
          </Form.Item>

          <Form.Item<formPostData>
            name="description"
            label="Descrição"
            rules={[
              {
                max: 300,
                message: "Descrição não deve exceder 300 caracteres",
              },
            ]}
          >
            <Input.TextArea />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              loading={creating}
              htmlType="submit"
              style={{
                width: "100%",
              }}
            >
              Criar
            </Button>
          </Form.Item>
        </Form>
      );
    } else {
      const props: UploadProps = {
        name: "file",
        accept: ".csv",
        multiple: false,
        action: upload_endpoint,
        beforeUpload: () => {
          getNewTokenIfExpired();
        },
        onChange(info) {
          const { status } = info.file;
          if (status === "uploading") return;

          if (status === "done") {
            messageApi.success(
              `"${info.file.name}" Ficheiro processado com sucesso.`,
            );
          } else if (status === "error") {
            const response = info.file.response;
            setErrorModal(response.errors.file);

            // No error msg sent by the server
            if (!response)
              messageApi.error(
                `"${info.file.name}" Erro ao processar ficheiro.`,
              );
          }
        },
      };

      return (
        <>
          {renderPopup()}
          <Dragger {...props}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              Clique ou arraste um ficheiro para aqui
            </p>
            <p className="ant-upload-hint">Apenas ficheiros .csv</p>
          </Dragger>
        </>
      );
    }
  };

  return (
    <>
      {contextHolder}
      <Card
        tabList={tabs}
        style={{
          minWidth: "60%",
        }}
        onTabChange={(tab) => {
          if (tab === "csv") setManualMode(false);
          else setManualMode(true);
        }}
      >
        {renderCard()}
      </Card>
    </>
  );
}
