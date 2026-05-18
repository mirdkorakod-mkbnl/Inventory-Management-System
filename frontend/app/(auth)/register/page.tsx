"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  TextInput,
  PasswordInput,
  Anchor,
  Paper,
  Title,
  Text,
  Container,
  Button,
  ThemeIcon,
  rem,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconUser, IconAt, IconLock, IconPackage, IconCheck, IconX } from "@tabler/icons-react";

export default function Register() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // ✅ ใช้ Mantine Form Hook เพื่อจัดการ State และ Validation
  const form = useForm({
    initialValues: {
      name: "",
      email: "",
      password: "",
    },

    // ✅ เพิ่ม Validation ง่ายๆ ก่อนส่งไป Backend
    validate: {
      name: (value) => (value.length < 2 ? "Name must have at least 2 letters" : null),
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
      password: (value) => (value.length < 6 ? "Password must include at least 6 characters" : null),
    },
  });

  const handleRegister = async (values: typeof form.values) => {
    setLoading(true);

    try {
      await axios.post("http://localhost:8080/api/register", {
        name: values.name,
        email: values.email,
        password: values.password,
      });

      // ✅ แจ้งเตือนสำเร็จสวยๆ
      notifications.show({
        title: "Registration Successful!",
        message: "You can now login with your account.",
        color: "green",
        icon: <IconCheck style={{ width: rem(18), height: rem(18) }} />,
      });

      router.push("/login"); // เด้งไปหน้า Login
    } catch (error: any) {
      console.error(error);
      
      // ✅ แจ้งเตือน Error
      notifications.show({
        title: "Registration Failed",
        message: error.response?.data?.error || "Email might be taken or server error.",
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
        
        {/* Header / Logo */}
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          {/* ทำ Logo เอียงนิดๆ เหมือนต้นฉบับ */}
          <ThemeIcon 
            size="xl" 
            radius="md" 
            variant="gradient" 
            gradient={{ from: 'indigo', to: 'violet' }} 
            mb="md"
            style={{ transform: 'rotate(-3deg)' }}
          >
            <IconPackage size={28} stroke={1.5} style={{ transform: 'rotate(3deg)' }} />
          </ThemeIcon>
          
          <Title style={{ fontFamily: "Greycliff CF, sans-serif", fontWeight: 900 }}>
            Create an account
          </Title>
          <Text c="dimmed" size="sm" mt={5}>
            Join Stock Manager to start tracking
          </Text>
        </div>

        {/* Form Card */}
        <Paper withBorder shadow="md" p={30} mt={30} radius="md">
          <form onSubmit={form.onSubmit(handleRegister)}>
            
            <TextInput
              label="Full Name"
              placeholder="John Doe"
              leftSection={<IconUser size={16} />}
              required
              {...form.getInputProps("name")}
            />

            <TextInput
              label="Email"
              placeholder="you@example.com"
              mt="md"
              leftSection={<IconAt size={16} />}
              required
              {...form.getInputProps("email")}
            />

            <PasswordInput
              label="Password"
              placeholder="Your password"
              mt="md"
              leftSection={<IconLock size={16} />}
              required
              {...form.getInputProps("password")}
            />

            <Button fullWidth mt="xl" type="submit" loading={loading} color="indigo">
              Sign Up
            </Button>
          </form>
        </Paper>

        {/* Footer Link */}
        <Text c="dimmed" size="sm" ta="center" mt={20}>
          Already have an account?{" "}
          <Anchor component={Link} href="/login" size="sm" fw={700}>
            Login here
          </Anchor>
        </Text>

      </Container>
    </div>
  );
}