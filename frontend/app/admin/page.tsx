"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  AppShell,
  Container,
  Paper,
  Group,
  Title,
  Button,
  Table,
  Badge,
  Text,
  ActionIcon,
  Modal,
  TextInput,
  NumberInput,
  LoadingOverlay,
  rem,
  SimpleGrid,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconLogout,
  IconHome,
  IconPlus,
  IconEdit,
  IconTrash,
  IconShieldLock,
  IconCheck,
  IconX,
} from "@tabler/icons-react";

// Types
interface Product {
  ID: number;
  name: string;
  code: string;
  price: number;
  stock: number;
  User?: { email: string; name: string };
  user?: { email: string; name: string };
}

export default function AdminPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);

  //Import ข้อมูล
  const [importOpened, { open: openImport, close: closeImport }] = useDisclosure(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  const [previewData, setPreviewData] = useState<any[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [isAdmin, setIsAdmin] = useState(false);

  // Mantine Hooks
  const [opened, { open, close }] = useDisclosure(false);

  // Form Management
  const form = useForm({
    initialValues: {
      name: "",
      price: 0,
      stock: 0,
    },
    validate: {
      name: (value) => (value.length < 2 ? "Name is too short" : null),
    },
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      headers: { Authorization: `Bearer ${token}` },
    };
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      // Decode JWT logic (original)
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join("")
      );
      const payload = JSON.parse(jsonPayload);

      // Check Admin Role
      if (payload.role !== "admin") {
        notifications.show({
          title: "Access Denied",
          message: "You do not have permission to view this page.",
          color: "red",
        });
        router.push("/");
        return;
      }
      fetchProducts();
    } catch (e) {
      router.push("/login");
    }
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:8080/api/products", getAuthHeaders());
      setProducts(res.data);
    } catch (error) {
      console.error(error);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    document.cookie = "token=; path=/; max-age=0";
    router.push("/login");
  };

  // Modal Handlers
  const openCreateModal = () => {
    setEditingId(null);
    form.reset();
    open();
  };

  const openEditModal = (p: Product) => {
    setEditingId(p.ID);
    form.setValues({
      name: p.name,
      price: p.price,
      stock: p.stock,
    });
    open();
  };

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const payload = {
        name: values.name,
        price: Number(values.price),
        stock: Number(values.stock),
      };

      if (editingId) {
        await axios.put(
          `http://localhost:8080/api/admin/products/${editingId}`,
          payload,
          getAuthHeaders()
        );
        notifications.show({
            title: "Updated",
            message: "Product updated successfully",
            color: "green",
            icon: <IconCheck size={16} />,
          });
      } else {
        await axios.post("http://localhost:8080/api/products", payload, getAuthHeaders());
        notifications.show({
            title: "Created",
            message: "New product added",
            color: "green",
            icon: <IconCheck size={16} />,
          });
      }
      close();
      fetchProducts();
    } catch (error) {
        notifications.show({
            title: "Error",
            message: "Failed to save product",
            color: "red",
            icon: <IconX size={16} />,
          });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("⚠️ Confirm Delete (Admin)?")) return;
    try {
      await axios.delete(`http://localhost:8080/api/admin/products/${id}`, getAuthHeaders());
      notifications.show({
        title: "Deleted",
        message: "Product deleted",
        color: "blue",
      });
      fetchProducts();
    } catch (error) {
        notifications.show({
            title: "Error",
            message: "Delete failed",
            color: "red",
          });
    }
  };

  const handleImport = async () => {
  if (!importFile) {
    notifications.show({
      title: "No file selected",
      message: "Please choose a CSV file",
      color: "red",
    });
    return;
  }

  const formData = new FormData();
  formData.append("file", importFile);

  try {
    await axios.post(
      "http://localhost:8080/api/admin/products/import",
      formData,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    notifications.show({
      title: "Import success",
      message: "Products imported successfully",
      color: "green",
    });

    closeImport();
    setImportFile(null);
    fetchProducts();
  } catch (error) {
    notifications.show({
      title: "Import failed",
      message: "Cannot import file",
      color: "red",
    });
  }
};

const handleDownloadTemplate = () => {
  window.open(
    "http://localhost:8080/api/products/import/template",
    "_blank"
  );
};

const handlePreview = async () => {
  if (!importFile) {
    notifications.show({
      title: "No file selected",
      message: "Please choose a file",
      color: "red",
    });
    return;
  }

  const formData = new FormData();
  formData.append("file", importFile);

  try {
    setPreviewLoading(true);

    const res = await axios.post(
      isAdmin
        ? "http://localhost:8080/api/admin/products/import/preview"
        : "http://localhost:8080/api/products/import/preview",
      formData,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    setPreviewData(res.data.preview);
  } catch (err) {
    notifications.show({
      title: "Preview failed",
      message: "Cannot preview file",
      color: "red",
    });
  } finally {
    setPreviewLoading(false);
  }
};



  return (
    <div style={{ backgroundColor: "#1a1b1e", minHeight: "100vh", color: "#C1C2C5" }}>
      {/* NAVBAR */}
      <Paper p="md" shadow="xs" radius={0} bg="dark.7" style={{ borderBottom: '1px solid #2C2E33' }}>
        <Container size="xl">
          <Group justify="space-between">
            <Group>
                <IconShieldLock size={28} color="#6366f1" />
                <Title order={3} c="white">Admin Dashboard</Title>
            </Group>

            <Group>
              <Button
                variant="subtle"
                color="gray"
                leftSection={<IconHome size={18} />}
                onClick={() => router.push("/")}
              >
                Go to Home
              </Button>
              <Button
                color="red"
                variant="light"
                leftSection={<IconLogout size={18} />}
                onClick={handleLogout}
              >
                Logout
              </Button>
            </Group>
          </Group>
        </Container>
      </Paper>

      {/* MAIN CONTENT */}
      <Container size="xl" py="xl">
        <Group justify="space-between" mb="lg">
        <Title order={2} c="white">Manage Inventory</Title>
        <Group>

          <Button
          variant="outline"
          color="blue"
          onClick={handleDownloadTemplate}
          >
            Download Template
          </Button>


          {/* ✅ IMPORT */}
          <Button
          variant="light"
          color="green"
          onClick={openImport}
          disabled={loading}
          >
            Import
          </Button>


          {/* ADD */}
          <Button
            leftSection={<IconPlus size={18} />}
            color="indigo"
            onClick={openCreateModal}
          >
            Add Product
          </Button>
        </Group>
      </Group>

        <Paper shadow="sm" radius="md" p="md" bg="dark.6" pos="relative">
          <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
          
          <Table.ScrollContainer minWidth={800}>
            <Table verticalSpacing="sm" highlightOnHover>
              <Table.Thead bg="dark.5">
                <Table.Tr>
                  <Table.Th c="dimmed">ID</Table.Th>
                  <Table.Th c="dimmed">Owner</Table.Th>
                  <Table.Th c="dimmed">Name</Table.Th>
                  <Table.Th c="dimmed">Code</Table.Th>
                  <Table.Th c="dimmed" style={{ textAlign: "right" }}>Price</Table.Th>
                  <Table.Th c="dimmed" style={{ textAlign: "center" }}>Stock</Table.Th>
                  <Table.Th c="dimmed" style={{ textAlign: "center" }}>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {products.map((p) => {
                   const ownerEmail = p.User?.email || p.user?.email || "Unknown";
                   return (
                    <Table.Tr key={p.ID}>
                        <Table.Td>
                            <Text fz="xs" c="dimmed" ff="monospace">#{p.ID}</Text>
                        </Table.Td>
                        <Table.Td>
                            <Text fz="sm" c="yellow.4" fw={500}>{ownerEmail}</Text>
                        </Table.Td>
                        <Table.Td>
                            <Text fw={700} c="white">{p.name}</Text>
                        </Table.Td>
                        <Table.Td>
                            <Badge variant="outline" color="indigo">{p.code}</Badge>
                        </Table.Td>
                        <Table.Td style={{ textAlign: "right" }}>
                            <Text c="teal.4" fw={700}>฿{p.price.toLocaleString()}</Text>
                        </Table.Td>
                        <Table.Td style={{ textAlign: "center" }}>
                            <Badge 
                                color={p.stock > 0 ? "green" : "red"} 
                                variant="light"
                            >
                                {p.stock}
                            </Badge>
                        </Table.Td>
                        <Table.Td>
                            <Group justify="center" gap="xs">
                                <ActionIcon variant="light" color="blue" onClick={() => openEditModal(p)}>
                                    <IconEdit size={16} />
                                </ActionIcon>
                                <ActionIcon variant="light" color="red" onClick={() => handleDelete(p.ID)}>
                                    <IconTrash size={16} />
                                </ActionIcon>
                            </Group>
                        </Table.Td>
                    </Table.Tr>
                   );
                })}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Paper>
      </Container>

      {/* MODAL */}
      <Modal 
        opened={opened} 
        onClose={close} 
        title={editingId ? "Edit Product" : "New Product"}
        centered
      >
         <form onSubmit={form.onSubmit(handleSubmit)}>
            <SimpleGrid cols={1} spacing="md">
                <TextInput
                    label="Product Name"
                    placeholder="Gaming Mouse"
                    withAsterisk
                    {...form.getInputProps("name")}
                />
                <TextInput
                  label="Code"
                  value={editingId ? products.find(p => p.ID === editingId)?.code : "Auto-generated"}
                  disabled
                />
                <SimpleGrid cols={2}>
                    <NumberInput
                        label="Price"
                        prefix="฿"
                        min={0}
                        allowNegative={false}
                        withAsterisk
                        {...form.getInputProps("price")}
                    />
                    <NumberInput
                        label="Stock"
                        min={0}
                        allowNegative={false}
                        withAsterisk
                        {...form.getInputProps("stock")}
                    />
                </SimpleGrid>
            </SimpleGrid>

            <Group justify="flex-end" mt="xl">
                <Button variant="default" onClick={close}>Cancel</Button>
                <Button type="submit" color="indigo">{editingId ? "Save Changes" : "Create Product"}</Button>
            </Group>
         </form>
      </Modal>

       {/* IMPORT MODAL */}
      <Modal
        opened={importOpened}
        onClose={closeImport}
        title="Import Products"
        centered
      >
        <SimpleGrid cols={1} spacing="md">
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => setImportFile(e.target.files?.[0] || null)}
          />

          {previewData.length > 0 && (
          <Table border={1} mt="md">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Price</Table.Th>
                <Table.Th>Stock</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {previewData.map((p, i) => (
                <Table.Tr key={i}>
                  <Table.Td>{p.name}</Table.Td>
                  <Table.Td>{p.price}</Table.Td>
                  <Table.Td>{p.stock}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={closeImport}>
              Cancel
            </Button>
            <Button color="green" onClick={handleImport}>
              Import
            </Button>
          </Group>
        </SimpleGrid>
      </Modal>

    </div>
  );
}