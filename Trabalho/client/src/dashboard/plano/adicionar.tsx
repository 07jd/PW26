import {
  Button,
  Card,
  Col,
  Flex,
  Form,
  Input,
  InputNumber,
  message,
  Row,
  Select,
  Slider,
} from "antd";
import { useForm } from "antd/es/form/Form";
import TextArea from "antd/es/input/TextArea";
import useMessage from "antd/es/message/useMessage";
import { useState } from "react";
import type { herbEntryData } from "../erva/erva";
import { getNewTokenIfExpired } from "../../util";
import { getEntries } from "../erva/shared";
import { endpoint } from "./plano";

export function Adicionar() {
  const [form] = useForm();
  const [msg, context] = useMessage();
  const [tempRange, setTempRange] = useState([17.5, 27.5]);
  const [humidityRange, setHumidityRange] = useState([20.5, 85]);
  const [loadingHerbs, setLoadingHerbs] = useState(false);
  const [data, setData] = useState<herbEntryData[]>([]);
  const [formType, setFormType] = useState("regular");
  const selectedHerb = Form.useWatch("select_herb", form);
  const disableFields = !selectedHerb;

  const add = async () => {
    const type = form.getFieldValue("type");
    const base = {
      name: form.getFieldValue("name"),
      herb: form.getFieldValue("select_herb"),
    };

    let payload = undefined;
    if (type === "regular") {
      payload = {
        ...base,
        duration: form.getFieldValue("duration"),
        fertilization: {
          frequency: form.getFieldValue("frequency"),
          quantity: form.getFieldValue("quantity"),
        },
        watering: form.getFieldValue("watering"),
        humidity: {
          min: humidityRange[0],
          max: humidityRange[1],
        },
        luminosity: {
          min: form.getFieldValue("min_luminosity"),
          max: form.getFieldValue("max_luminosity"),
        },
        temperature: {
          min: tempRange[0],
          max: tempRange[1],
        },
      };

      if (payload.luminosity.min > payload.luminosity.max) {
        form.setFields([
          {
            name: "min_luminosity",
            errors: ["Luminosidade mínima deve ser inferior ou igual á máxima"],
          },
        ]);
      }
    }
    if (type === "emergencia") {
      payload = {
        ...base,
        minInterval: form.getFieldValue("min_interval"),
        dosage: form.getFieldValue("dosage"),
        intensity: form.getFieldValue("intensity"),
        reason: form.getFieldValue("reason"),
      };
    }
    if (type === "pontual") {
      payload = {
        ...base,
        approvedBy: form.getFieldValue("approved_by"),
        action: form.getFieldValue("action"),
      };
    }

    console.log(payload);
    const post_endpoint = `${endpoint}/${type}`;
    try {
      await getNewTokenIfExpired();
      const response = await fetch(post_endpoint, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      console.log(payload);

      if (response.ok) {
        message.open({
          type: "success",
          content: ["Plano adicionado"],
        });

        form.resetFields();
        return;
      }

      const err_data = await response.json();
      for (const [key, val] of Object.entries(err_data.errors)) {
        if (key.includes("name")) {
          form.setFields([
            {
              name: "name",
              errors: [String(val)],
            },
          ]);
        }

        if (key.includes("fertilization.frequency")) {
          form.setFields([
            {
              name: "frequency",
              errors: [String(val)],
            },
          ]);
        }

        if (key.includes("fertilization.quantity")) {
          form.setFields([
            {
              name: "quantity",
              errors: [String(val)],
            },
          ]);
        }

        if (key.includes("watering")) {
          form.setFields([
            {
              name: "watering",
              errors: [String(val)],
            },
          ]);
        }

        if (key.includes("duration")) {
          form.setFields([
            {
              name: "duration",
              errors: [String(val)],
            },
          ]);
        }

        if (key.includes("luminosity.min")) {
          form.setFields([
            {
              name: "min_luminosity",
              errors: [String(val)],
            },
          ]);
        }

        if (key.includes("luminosity.max")) {
          form.setFields([
            {
              name: "max_luminosity",
              errors: [String(val)],
            },
          ]);
        }

        if (key.includes("reason")) {
          form.setFields([
            {
              name: "reason",
              errors: [String(val)],
            },
          ]);
        }

        if (key.includes("min_interval")) {
          form.setFields([
            {
              name: "min_interval",
              errors: [String(val)],
            },
          ]);
        }

        if (key.includes("action")) {
          form.setFields([
            {
              name: "action",
              errors: [String(val)],
            },
          ]);
        }

        if (key.includes("approvedBy")) {
          form.setFields([
            {
              name: "approved_by",
              errors: [String(val)],
            },
          ]);
        }
      }
    } catch (e) {
      console.log(e);
      message.open({
        type: "error",
        content: ["Tente novamente mais tarde"],
      });
    }
  };

  return (
    <>
      {context}
      <Card style={{ minWidth: "60%" }}>
        <Form form={form} layout="vertical" onFinish={add}>
          <Flex gap={12}>
            <Form.Item
              label="Nome"
              required
              name="name"
              style={{ flex: 1 }}
              rules={[
                {
                  required: true,
                  message: "Nome necessário",
                },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Tipo"
              required
              initialValue="regular"
              name="type"
              style={{ flex: 1 }}
              rules={[
                {
                  required: true,
                  message: "Tipo necessário",
                },
              ]}
            >
              <Select
                disabled={loadingHerbs}
                onChange={(e) => {
                  setFormType(e);
                }}
                options={[
                  { label: "Regular", value: "regular" },
                  { label: "Emergência", value: "emergencia" },
                  { label: "Pontual", value: "pontual" },
                ]}
              />
            </Form.Item>
          </Flex>

          <Form.Item label="Seleciona uma erva" name="select_herb" required>
            <Select
              showSearch={{
                optionFilterProp: "label",
              }}
              placeholder="Manjericão"
              loading={loadingHerbs}
              allowClear={true}
              onFocus={() => getEntries(msg, setLoadingHerbs, setData)}
              options={data.map((i) => ({
                label: i.name,
                value: i.id,
              }))}
              onDeselect={() => {
                setLoadingHerbs(false);
              }}
              onClear={() => {
                setLoadingHerbs(false);
              }}
            />
          </Form.Item>

          {formType === "regular" && (
            <>
              <Form.Item
                required
                label="Temperatura (ºC)"
                name="temperature_range"
              >
                <Slider
                  disabled={disableFields}
                  min={0}
                  max={50}
                  step={0.5}
                  range
                  defaultValue={[17.5, 27.5]}
                  onChange={(e) => setTempRange(e)}
                  marks={{
                    0: "0ºC",
                    50: "50ºC",
                  }}
                />
              </Form.Item>

              <Form.Item required label="Humidade Relativa (%)" name="humidity">
                <Slider
                  disabled={disableFields}
                  min={0}
                  max={100}
                  step={0.5}
                  range
                  defaultValue={[20.5, 85]}
                  onChange={(e) => setHumidityRange(e)}
                  marks={{
                    0: "0%",
                    100: "100%",
                  }}
                />
              </Form.Item>

              <Flex gap={12} justify="space-between">
                <Form.Item
                  label="Luminosidade (Lux)"
                  required
                  name="luminosity"
                >
                  <Flex vertical gap={12}>
                    <Form.Item
                      required
                      noStyle
                      name="min_luminosity"
                      rules={[
                        {
                          required: true,
                          message: "Luminosidade mínima necessária",
                        },
                      ]}
                    >
                      <InputNumber
                        min={0}
                        placeholder="Min"
                        style={{ width: "100%" }}
                        disabled={disableFields}
                      />
                    </Form.Item>

                    <Form.Item
                      required
                      noStyle
                      name="max_luminosity"
                      rules={[
                        {
                          required: true,
                          message: "Luminosidade máxima necessária",
                        },
                      ]}
                    >
                      <InputNumber
                        min={0}
                        placeholder="Max"
                        style={{ width: "100%" }}
                        disabled={disableFields}
                      />
                    </Form.Item>
                  </Flex>
                </Form.Item>

                <Form.Item label="Fertilização" required>
                  <Flex vertical gap={12}>
                    <Form.Item
                      required
                      noStyle
                      name="frequency"
                      rules={[
                        {
                          required: true,
                          message: "Frequência necessária",
                        },
                      ]}
                    >
                      <InputNumber
                        min={0}
                        placeholder="Frequência"
                        style={{ width: "100%" }}
                        disabled={disableFields}
                      />
                    </Form.Item>

                    <Form.Item
                      required
                      noStyle
                      name="quantity"
                      rules={[
                        {
                          required: true,
                          message: "Quantidade necessária",
                        },
                      ]}
                    >
                      <InputNumber
                        min={0}
                        placeholder="Quantidade"
                        style={{ width: "100%" }}
                        disabled={disableFields}
                      />
                    </Form.Item>
                  </Flex>
                </Form.Item>

                <Form.Item label="Outros" required name="other">
                  <Flex vertical gap={12}>
                    <Form.Item
                      required
                      noStyle
                      name="watering"
                      rules={[
                        {
                          required: true,
                          message: "Rega necessária",
                        },
                      ]}
                    >
                      <InputNumber
                        min={0}
                        placeholder="Rega (por dia)"
                        style={{ width: "100%" }}
                        disabled={disableFields}
                      />
                    </Form.Item>

                    <Form.Item
                      required
                      noStyle
                      name="duration"
                      rules={[
                        {
                          required: true,
                          message: "Duração necessária",
                        },
                      ]}
                    >
                      <InputNumber
                        min={0}
                        placeholder="Duração (dias)"
                        style={{ width: "100%" }}
                        disabled={disableFields}
                      />
                    </Form.Item>
                  </Flex>
                </Form.Item>
              </Flex>
            </>
          )}

          {formType === "emergencia" && (
            <>
              <Row gutter={16}>
                <Col xs={24} md={8}>
                  <Form.Item
                    required
                    label="Intervalo Mínimo (h)"
                    name="min_interval"
                    rules={[
                      {
                        required: true,
                        message: "Intervalo minímo necessário",
                      },
                    ]}
                  >
                    <InputNumber
                      min={1}
                      style={{ width: "100%" }}
                      disabled={disableFields}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item
                    required
                    label="Dosagem (unidades)"
                    name="dosage"
                    rules={[
                      {
                        required: true,
                        message: "Dosagem necessária",
                      },
                    ]}
                  >
                    <InputNumber
                      min={1}
                      style={{ width: "100%" }}
                      disabled={disableFields}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item
                    required
                    label="Intensidade (1-10)"
                    name="intensity"
                    rules={[
                      {
                        required: true,
                        message: "Intensidade necessária",
                      },
                    ]}
                  >
                    <InputNumber
                      min={1}
                      max={10}
                      style={{ width: "100%" }}
                      disabled={disableFields}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                required
                label="Razão"
                name="reason"
                rules={[
                  {
                    required: true,
                    message: "Razão necessária",
                  },
                ]}
              >
                <TextArea disabled={disableFields}></TextArea>
              </Form.Item>
            </>
          )}

          {formType === "pontual" && (
            <>
              <Form.Item
                label="Aprovado por"
                name="approved_by"
                required
                rules={[
                  {
                    required: true,
                    message: "Forneça quem aprovou",
                  },
                ]}
              >
                <Input
                  disabled={disableFields}
                  placeholder="joao@gmail.com"
                ></Input>
              </Form.Item>
              <Form.Item
                label="Ação"
                name="action"
                required
                rules={[
                  {
                    required: true,
                    message: "Descreva a ação a tomar",
                  },
                ]}
              >
                <TextArea disabled={disableFields} minLength={0}></TextArea>
              </Form.Item>
            </>
          )}
          <Form.Item>
            <Button
              type="primary"
              style={{ width: "100%" }}
              htmlType="submit"
              disabled={disableFields}
            >
              Criar
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </>
  );
}
