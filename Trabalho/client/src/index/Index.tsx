import { Button } from 'antd'

export default function App() {
  return (
    <>
      <h1>homepage</h1>
      <Button onClick={() => {
        window.location.replace("/auth");
      }}>Go to auth</Button>
    </>
  )
}
