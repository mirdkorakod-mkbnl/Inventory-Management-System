"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Container, Paper, Title, Text, TextInput, Button, Anchor, Center, Box, rem } from "@mantine/core";
import { IconArrowLeft, IconMail } from "@tabler/icons-react";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";

export default function ForgotPassword() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: { email: "" },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      await axios.post("http://localhost:8080/api/forgot-password", values);
      notifications.show({
        title: "Check your email",
        message: "If the email exists, a reset link has been sent.",
        color: "green",
      });
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Something went wrong",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center">Forgot Password?</Title>
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput label="Your email" placeholder="me@email.com" required {...form.getInputProps("email")} />
          <Button fullWidth mt="xl" type="submit" loading={loading}>Reset Password</Button>
          <Center mt="md">
            <Anchor c="dimmed" size="sm" onClick={() => router.push("/login")}>
              <Center inline>
                <IconArrowLeft style={{ width: rem(12), height: rem(12) }} />
                <Box ml={5}>Back to login</Box>
              </Center>
            </Anchor>
          </Center>
        </form>
      </Paper>
    </Container>
  );
}