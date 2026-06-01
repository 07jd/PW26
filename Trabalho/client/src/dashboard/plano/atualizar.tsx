import { useState } from "@rc-component/util";
import {
  Button,
  Card,
  Col,
  Flex,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Slider,
} from "antd";
import useMessage from "antd/es/message/useMessage";
import { getNewTokenIfExpired } from "../../util";
import { endpoint } from "./plano";
import type { tableData } from "./consultar";
import TextArea from "antd/es/input/TextArea";
import { useEffect } from "react";

interface searchData {
  id: string;
  name: string;
}

export function Atualizar() {
  const [message, context] = useMessage();
  const [searchData, setSearchData] = useState<searchData[]>([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [pickedPlan, setPickedPlan] = useState(false);
  const [planData, setPlanData] = useState<tableData | null>();
  const [rangeTemp, setRangeTemp] = useState<number[]>([]);
  const [rangeHum, setRangeHum] = useState<number[]>([]);

  useEffect(() => {
    if (!planData) return;

    if (planData.temperature) {
      setRangeTemp([planData.temperature?.min, planData.temperature?.max]);
    }
    if (planData.humidity) {
      setRangeHum([planData.humidity?.min, planData.humidity?.max]);
    }

    form.setFieldsValue({
      temperature_range: [planData.temperature?.min, planData.temperature?.max],
      name: planData.name,
      humidity: [planData.humidity?.min, planData.humidity?.max],
      min_luminosity: planData.luminosity?.min,
      max_luminosity: planData.luminosity?.max,
      frequency: planData.fertilization?.frequency,
      quantity: planData.fertilization?.quantity,
      watering: planData.watering,
      duration: planData.duration,
      min_interval: planData.minInterval,
      dosage: planData.dosage,
      intensity: planData.itensity,
      reason: planData.reason,
      approved_by: planData.approvedBy?.email,
      action: planData.action,
    });
  }, [planData, form]);

  const getPlansSearch = async () => {
    try {
      setLoading(true);
      await getNewTokenIfExpired();
      const response = await fetch(endpoint);

      if (!response.ok) throw new Error();
      const data = await response.json();
      setSearchData(data);

      setLoading(false);
    } catch (e) {
      console.log(e);
      setLoading(false);
      message.open({
        type: "error",
        content: "Tente novamente mais tarde",
      });
    }
  };

  const getPlanDetails = async (id: string) => {
    try {
      await getNewTokenIfExpired();
      const response = await fetch(`${endpoint}/${id}`);

      if (!response.ok) throw new Error();

      const data = await response.json();
      setPlanData(data);
    } catch (e) {
      console.log(e);
      setPickedPlan(false);
      message.open({
        type: "error",
        content: "Tente novamente mais tarde",
      });
    }
  };

  const updatePlan = async () => {
    const type = planData?.type;
    const id = form.getFieldValue("plan");
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
          min: rangeHum[0],
          max: rangeHum[1],
        },
        luminosity: {
          min: form.getFieldValue("min_luminosity"),
          max: form.getFieldValue("max_luminosity"),
        },
        temperature: {
          min: rangeTemp[0],
          max: rangeTemp[1],
        },
      };
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

    try {
      await getNewTokenIfExpired();
      const response = await fetch(`${endpoint}/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if (response.status === 401) {
          message.open({
            type: "error",
            content: "Não tem permição para realizar isto",
          });
        }

        throw new Error();
      }

      form.resetFields();
      setPickedPlan(false);
      setPlanData(null);
      message.open({
        type: "success",
        content: "Dados alterados",
      });
    } catch (e) {
      console.log(e);
      message.open({
        type: "error",
        content: "Tente novamente mais tarde",
      });
    }

    console.log(payload);
  };

  return (
    <>
      {context}
      <Card
        style={{
          minWidth: "60%",
        }}
      >
        <Form form={form} onFinish={() => updatePlan()}>
          <Form.Item
            label="Plano"
            name="plan"
            required
            rules={[
              {
                required: true,
                message: "Selecione o plano a modificar",
              },
            ]}
          >
            <Select
              showSearch={{
                optionFilterProp: "label",
              }}
              loading={loading}
              placeholder="Plano regular de pimenta"
              allowClear
              onClear={() => setPickedPlan(false)}
              onFocus={() => getPlansSearch()}
              onSelect={(id) => getPlanDetails(id)}
              onDeselect={() => setPickedPlan(false)}
              options={searchData.map((i) => ({
                label: i.name,
                value: i.id,
              }))}
            />
          </Form.Item>

          {planData?.name && (
            <Form.Item label="Nome" name="name">
              <Input min={0}></Input>
            </Form.Item>
          )}

          {planData?.type === "regular" && (
            <>
              <Form.Item
                required
                label="Temperatura (ºC)"
                name="temperature_range"
              >
                <Slider
                  disabled={pickedPlan}
                  min={0}
                  max={50}
                  step={0.5}
                  range
                  defaultValue={[17.5, 27.5]}
                  onChange={(value) => {
                    setRangeTemp(value);
                  }}
                  marks={{
                    0: "0ºC",
                    50: "50ºC",
                  }}
                />
              </Form.Item>

              <Form.Item required label="Humidade Relativa (%)" name="humidity">
                <Slider
                  disabled={pickedPlan}
                  min={0}
                  max={100}
                  step={0.5}
                  range
                  defaultValue={[20.5, 85]}
                  onChange={(value) => {
                    setRangeHum(value);
                  }}
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
                        disabled={pickedPlan}
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
                        disabled={pickedPlan}
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
                        disabled={pickedPlan}
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
                        disabled={pickedPlan}
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
                        disabled={pickedPlan}
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
                        disabled={pickedPlan}
                      />
                    </Form.Item>
                  </Flex>
                </Form.Item>
              </Flex>
            </>
          )}

          {planData?.type === "emergencia" && (
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
                      disabled={pickedPlan}
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
                      disabled={pickedPlan}
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
                      disabled={pickedPlan}
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
                <TextArea disabled={pickedPlan}></TextArea>
              </Form.Item>
            </>
          )}

          {planData?.type === "pontual" && (
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
                <Select disabled={pickedPlan} showSearch></Select>
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
                <TextArea disabled={pickedPlan} minLength={0}></TextArea>
              </Form.Item>
            </>
          )}

          {planData !== null && (
            <Button
              type="primary"
              style={{ width: "100%" }}
              htmlType="submit"
              disabled={pickedPlan}
            >
              Atualizar
            </Button>
          )}
        </Form>
      </Card>
      )
    </>
  );
}
