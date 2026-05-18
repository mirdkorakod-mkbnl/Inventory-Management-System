"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  TextInput,
  PasswordInput,
  Checkbox,
  Anchor,
  Paper,
  Title,
  Text,
  Container,
  Group,
  Button,
  ThemeIcon,
  rem,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconAt, IconLock, IconPackage, IconCheck, IconX } from "@tabler/icons-react";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // ใช้ Mantine Form Hook แทน useState แยก
  const form = useForm({
    initialValues: {
      email: "",
      password: "",
    },
    validate: {
      email: (value) => (/^\S+@/.test(value) ? null : "Invalid email"),
      password: (value) => (value.length < 1 ? "Password is required" : null),
    },
  });

  const handleLogin = async (values: typeof form.values) => {
    setLoading(true);

    try {
      // 1. ยิง Login ไปที่ Backend
      const response = await axios.post("http://localhost:8080/api/login", {
        email: values.email,
        password: values.password,
      });

      const token = response.data.token;
      // เช็คว่า backend ส่ง user object กลับมาไหม ถ้าไม่มีให้กัน error ไว้
      const role = response.data.user?.role || "user";

      if (token) {
        // ✅ เก็บ Token เฉพาะใน localStorage
        localStorage.setItem("token", token);
        localStorage.setItem("role", role);

        // ✅ แจ้งเตือนสำเร็จ
        notifications.show({
          title: "Welcome back!",
          message: "Login successful",
          color: "green",
          icon: <IconCheck style={{ width: rem(18), height: rem(18) }} />,
        });

        // ✅ Redirect
        if (role === "admin") {
          // router.push("/admin"); // ถ้ามีหน้า Admin แยก
          router.push("/"); // กรณีใช้หน้าเดียวกัน
        } else {
          router.push("/");
        }
      } else {
        throw new Error("No token received");
      }
    } catch (error: any) {
      console.error(error);
      notifications.show({
        title: "Login Failed",
        message: error.response?.data?.message || "Please check your email or password.",
        color: "red",
        icon: <IconX style={{ width: rem(18), height: rem(18) }} />,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: "#f0f2f5", minHeight: "100vh", display: "flex", alignItems: "center" }}>
      <Container size={420} my={40}>
        
        {/* Header Section */}
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <ThemeIcon size="xl" radius="md" variant="gradient" gradient={{ from: 'indigo', to: 'cyan' }} mb="md">
            <IconPackage size={28} stroke={1.5} />
          </ThemeIcon>
          <Title
            style={{ fontFamily: "Greycliff CF, sans-serif", fontWeight: 900 }}
          >
            Stock Manager
          </Title>
          <Text c="dimmed" size="sm" mt={5}>
            Sign in to manage your inventory
          </Text>
        </div>

        {/* Card Section */}
        <Paper withBorder shadow="md" p={30} mt={30} radius="md">
          <form onSubmit={form.onSubmit(handleLogin)}>
            
            <TextInput
              label="Email"
              placeholder="you@example.com"
              leftSection={<IconAt size={16} />}
              required
              {...form.getInputProps("email")}
            />

            <PasswordInput
              label="Password"
              placeholder="Your password"
              required
              mt="md"
              leftSection={<IconLock size={16} />}
              {...form.getInputProps("password")}
            />

            <Group justify="space-between" mt="lg">
              <Checkbox label="Remember me" />
              <Anchor component={Link} href="/forgot-password" size="sm">
                Forgot password?
              </Anchor>
            </Group>

            <Button fullWidth mt="xl" type="submit" loading={loading} color="indigo">
              Sign in
            </Button>
          </form>
        </Paper>

        {/* Footer Section */}
        <Text c="dimmed" size="sm" ta="center" mt={20}>
          Do not have an account yet?{" "}
          <Anchor component={Link} href="/register" size="sm" fw={700}>
            Create account
          </Anchor>
        </Text>

      </Container>
    </div>
  );
}