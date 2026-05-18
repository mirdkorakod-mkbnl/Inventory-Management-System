"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { Container, Paper, Title, PasswordInput, Button, Group } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: { password: "", confirmPassword: "" },
    validate: {
      password: (val) => (val.length < 6 ? "Password too short" : null),
      confirmPassword: (val, values) => (val !== values.password ? "Passwords do not match" : null),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    if (!token) return;
    setLoading(true);
    try {
      await axios.post("http://localhost:8080/api/reset-password", {
        token,
        new_password: values.password,
        confirm_password: values.confirmPassword,
      });
      notifications.show({ title: "Success", message: "Password reset!", color: "green" });
      router.push("/login");
    } catch (error: any) {
      notifications.show({ title: "Error", message: error.response?.data?.error || "Failed", color: "red" });
    } finally {
      setLoading(false);
    }
  };

  if (!token) return <Title ta="center" c="red" mt={50}>Invalid Link</Title>;

  return (
    <Container size={420} my={40}>
      <Title ta="center">Set New Password</Title>
      <Paper withBorder shadow="md" p={30} mt={30}>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <PasswordInput label="New Password" required mt="md" {...form.getInputProps("password")} />
          <PasswordInput label="Confirm Password" required mt="md" {...form.getInputProps("confirmPassword")} />
          <Button fullWidth mt="xl" type="submit" loading={loading}>Change Password</Button>
        </form>
      </Paper>
    </Container>
  );
}

export default function ResetPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}