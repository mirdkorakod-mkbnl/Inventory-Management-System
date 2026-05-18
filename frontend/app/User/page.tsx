"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  Container,
  Paper,
  Group,
  Title,
  Button,
  Table,
  Badge,
  Text,
  Modal,
  TextInput,
  NumberInput,
  LoadingOverlay,
  SimpleGrid,
  ThemeIcon,
  ActionIcon,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconLogout,
  IconHome,
  IconPlus,
  IconEdit,
  IconPackage,
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
}

export default function UserProductPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Import
  const [importOpened, { open: openImport, close: closeImport }] = useDisclosure(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  // Mantine Hooks
  const [opened, { open, close }] = useDisclosure(false);

  // Mantine Form
  const form = useForm({
    initialValues: {
      name: "",
      price: 0,
      stock: 0,
    },
    validate: {
      name: (value) => (value.length < 1 ? "Product name is required" : null),
    },
  });

  // Helper สำหรับดึง Token
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      headers: { Authorization: `Bearer ${token}` },
    };
  };

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

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      // Decode JWT Logic
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

      // Check Role (Redirect Admin)
      if (payload.role === "admin") {
        router.push("/admin");
        return;
      }
      fetchProducts();
    } catch (e) {
      router.push("/login");
    }
  }, []);

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
          `http://localhost:8080/api/products/${editingId}`,
          payload,
          getAuthHeaders()
        );
        notifications.show({
          title: "Success",
          message: "Product updated successfully",
          color: "green",
          icon: <IconCheck size={16} />,
        });
      } else {
        await axios.post("http://localhost:8080/api/products", payload, getAuthHeaders());
        notifications.show({
          title: "Success",
          message: "Product created successfully",
          color: "green",
          icon: <IconCheck size={16} />,
        });
      }
      close();
      fetchProducts();
    } catch (error) {
      console.error(error);
      notifications.show({
        title: "Error",
        message: "Operation failed",
        color: "red",
        icon: <IconX size={16} />,
      });
    }
  };

  const handleImport = async () => {
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
    await axios.post(
      "http://localhost:8080/api/products/import",
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


  return (
    <div style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      {/* Navbar */}
      <Paper shadow="xs" p="md" bg="white">
        <Container size="xl">
          <Group justify="space-between">
            <Group>
              <ThemeIcon variant="light" size="lg" color="blue">
                <IconPackage size={20} />
              </ThemeIcon>
              <Title order={3} c="blue.8">User Stock</Title>
            </Group>

            <Group>
              <Button 
                variant="subtle" 
                color="gray" 
                leftSection={<IconHome size={18} />}
                onClick={() => router.push('/')}
              >
                Go to Home
              </Button>
              <Button
                variant="light"
                color="red"
                leftSection={<IconLogout size={18} />}
                onClick={handleLogout}
              >
                Logout
              </Button>
            </Group>
          </Group>
        </Container>
      </Paper>

      {/* Main Content */}
      <Container size="xl" py="xl">
        <Group justify="space-between" mb="lg">
        <Title order={2} c="gray.8">My Products</Title>
        <Group>
          <Button
            variant="light"
            color="green"
            onClick={openImport}
          >
            Import
          </Button>

          <Button leftSection={<IconPlus size={18} />} onClick={openCreateModal}>
            Add New
          </Button>
        </Group>
      </Group>

        <Paper shadow="sm" radius="md" p="md" pos="relative" withBorder>
          <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />

          <Table.ScrollContainer minWidth={800}>
            <Table verticalSpacing="sm" highlightOnHover>
              <Table.Thead bg="gray.0">
                <Table.Tr>
                  <Table.Th>ID</Table.Th>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Code</Table.Th>
                  <Table.Th style={{ textAlign: "right" }}>Price</Table.Th>
                  <Table.Th style={{ textAlign: "center" }}>Stock</Table.Th>
                  <Table.Th style={{ textAlign: "center" }}>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {products.length > 0 ? (
                  products.map((p) => (
                    <Table.Tr key={p.ID}>
                      <Table.Td>
                        <Text fz="xs" c="dimmed" ff="monospace">#{p.ID}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text fw={600} c="gray.8">{p.name}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="outline" color="gray" c="dimmed">{p.code}</Badge>
                      </Table.Td>
                      <Table.Td style={{ textAlign: "right" }}>
                        <Text c="green.8" fw={700}>฿{p.price.toLocaleString()}</Text>
                      </Table.Td>
                      <Table.Td style={{ textAlign: "center" }}>
                        <Badge
                          color={p.stock > 0 ? "teal" : "red"}
                          variant="light"
                        >
                          {p.stock}
                        </Badge>
                      </Table.Td>
                      <Table.Td style={{ textAlign: "center" }}>
                        <Button 
                            variant="light" 
                            color="yellow" 
                            size="xs" 
                            leftSection={<IconEdit size={14} />}
                            onClick={() => openEditModal(p)}
                        >
                            Edit
                        </Button>
                      </Table.Td>
                    </Table.Tr>
                  ))
                ) : (
                  <Table.Tr>
                    <Table.Td colSpan={6} align="center" py="xl">
                      <Text c="dimmed">No products found. Start by adding one!</Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Paper>
      </Container>

      {/* Modal */}
      <Modal
        opened={opened}
        onClose={close}
        title={<Text fw={700}>{editingId ? "Edit Product" : "New Product"}</Text>}
        centered
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <SimpleGrid cols={1} spacing="md">
            <TextInput
              label="Product Name"
              placeholder="e.g. Gaming Mouse"
              withAsterisk
              data-autofocus
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
                placeholder="0.00"
                min={0}
                allowNegative={false}
                decimalScale={2}
                fixedDecimalScale
                withAsterisk
                {...form.getInputProps("price")}
              />
              <NumberInput
                label="Stock"
                placeholder="0"
                min={0}
                allowNegative={false}
                allowDecimal={false}
                withAsterisk
                {...form.getInputProps("stock")}
              />
            </SimpleGrid>
          </SimpleGrid>

          <Group justify="flex-end" mt="xl">
            <Button variant="default" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" color="blue">
              Save Product
            </Button>
          </Group>
        </form>
      </Modal>

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