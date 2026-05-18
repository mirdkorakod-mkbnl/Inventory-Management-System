"use client";

import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  MRT_GlobalFilterTextInput,
  MRT_ToggleFiltersButton,
  MRT_ShowHideColumnsButton,
  MRT_ToggleDensePaddingButton,
  MRT_ToggleFullScreenButton,
  MRT_TablePagination,

  MantineReactTable,
  useMantineReactTable,
  type MRT_ColumnDef,
} from "mantine-react-table";
import {
  Container,
  Group,
  Title,
  Button,
  Paper,
  Badge,
  Text,
  Card,
  LoadingOverlay,
  Box,
} from "@mantine/core";
// Note: useForm is removed as we removed the form box
import { notifications } from "@mantine/notifications";
import {
  IconPackage,
  IconLogout,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";

import StockByProductChart from "./component/StockByProductChart";

// --- Types ---
interface Product {
  ID: number;
  name: string;
  code: string;
  price: number;
  stock: number;
  User?: {
    Email?: string;
    name?: string;
  };
  user?: {
    email?: string;
  };
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userEmails, setUserEmails] = useState<string[]>([]);

  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  
  const router = useRouter();

  // --- Auth & Fetching Logic ---
  const getAuthHeaders = () => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      return {
        headers: { Authorization: `Bearer ${token}` },
      };
    }
    return { headers: {} };
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    checkUserRole(token);
    fetchProducts();
  }, []);

  useEffect(() => {
  setColumnOrder(
    isAdmin
      ? ["mrt-row-select", "owner", "name", "code", "price", "stock"]
      : ["mrt-row-select", "name", "code", "price", "stock"]
  );
}, [isAdmin]);


  const checkUserRole = (token: string) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(window.atob(base64));
      const role = payload.role || "";

      // ✅ ตรวจสอบเฉพาะ role ไม่ตรวจอีเมล
      if (role === "admin") {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error("Invalid Token", error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:8080/api/products", getAuthHeaders());
      setProducts(Array.isArray(res.data) ? res.data : []);

      const emails = new Set<string>();
      if (Array.isArray(res.data)) {
        res.data.forEach((p: Product) => {
            const email = p.User?.Email || p.user?.email;
            if (email) emails.add(email);
        });
      }
      setUserEmails(Array.from(emails));

    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  // --- Navigation Logic for Add New Product ---
  const handleAddNew = () => {
    if (isAdmin) {
        // Navigate to app/admin/page.tsx
        router.push("/admin");
    } else {
        // Navigate to app/products/page.tsx
        router.push("/User");
    }
  };

  // --- Export CSV ---
const handleExport = async () => {
  try {
    const res = await axios.get(
      "http://localhost:8080/api/products/export",
      {
        ...getAuthHeaders(),
        responseType: "blob", // ⭐ สำคัญ
      }
    );

    const blob = new Blob([res.data], {
      type: "text/csv;charset=utf-8;",
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = isAdmin
      ? "products_all.csv"
      : "my_products.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    notifications.show({
      title: "Export success",
      message: "CSV file downloaded",
      color: "green",
    });
  } catch (error) {
    notifications.show({
      title: "Export failed",
      message: "Cannot export products",
      color: "red",
    });
  }
};


  // --- Actions ---
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const url = `http://localhost:8080/api/products/${id}`;
      await axios.delete(url, getAuthHeaders());
      notifications.show({ title: "Deleted", message: "Product deleted", color: "gray", icon: <IconTrash size={16} /> });
      fetchProducts();
    } catch (error) {
      notifications.show({ title: "Error", message: "Failed to delete", color: "red" });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };


  // --- MRT Column Definitions ---
    
  //OWNER COLUMN (แยกชัดเจน)
  const ownerColumn: MRT_ColumnDef<Product> = {
    id: "owner",
    header: "Owner",
    accessorFn: (row) =>
      row.User?.Email || row.user?.email || "Unknown",
    filterVariant: "select",
    mantineFilterSelectProps: {
      data: userEmails,
    },
    Cell: ({ cell }) => {
      const val = cell.getValue<string>();
      return val === "Unknown" ? (
        <Text c="dimmed" fs="italic">
          No Owner
        </Text>
      ) : (
        <Badge variant="dot">{val}</Badge>
      );
    },
  };
  
  //Columns (ROLE BASED)
  const columns = useMemo<MRT_ColumnDef<Product>[]>(() => {
    const baseColumns: MRT_ColumnDef<Product>[] = [
      {
        accessorKey: "ID",
        header: "ID",
        enableEditing: false,
      },
      {
        accessorKey: "name",
        header: "Product Name",
        Cell: ({ renderedCellValue }) => (
          <Group gap="xs">
            <IconPackage size={16} />
            <Text fw={500}>{renderedCellValue}</Text>
          </Group>
        ),
      },
      {
        accessorKey: "code",
        header: "Code",
        Cell: ({ cell }) => (
          <Badge variant="outline">
            {cell.getValue<string>()}
          </Badge>
        ),
      },

      {
        accessorKey: "price",
        header: "Price",
        Cell: ({ cell }) => {
          const value = cell.getValue<number>();
          const hasDecimal = value % 1 !== 0;

          return (
            <Text c="teal" fw={700}>
              {value.toLocaleString("th-TH", {
                style: "currency",
                currency: "THB",
                minimumFractionDigits: hasDecimal ? 2 : 0,
                maximumFractionDigits: hasDecimal ? 2 : 0,
              })}
            </Text>
          );
        },
      },

      {
        accessorKey: "stock",
        header: "Stock",
        Cell: ({ cell }) => {
          const stock = cell.getValue<number>();
          return (
            <Badge
              color={stock > 0 ? "green" : "red"}
              variant={stock > 0 ? "light" : "filled"}
            >
              {stock}
            </Badge>
          );
        },
      },
    ];

    // ⭐ Admin เท่านั้นที่เห็น Owner
    return isAdmin
      ? [baseColumns[0], ownerColumn, ...baseColumns.slice(1)]
      : baseColumns;
  }, [isAdmin, userEmails]);

  // --- MRT Table Configuration ---
  const table = useMantineReactTable({
    columns,
    data: products ?? [], 
    
    enableRowSelection: true,
    enablePagination: true,
    
    enableGlobalFilter: true,
    enableColumnFilters: true,

     enableColumnOrdering: true,
    
    mantineTableProps: {
        className: 'custom-table-styles', 
        striped: true,
        highlightOnHover: true,
        withTableBorder: true,
    },

    

    // ⭐⭐ TOP TOOLBAR (จัดเองทั้งหมด)
  renderTopToolbar: ({ table }) => (
    <Group justify="space-between" w="100%">
      {/* ซ้าย */}
      <Button
        color="indigo"
        leftSection={<IconPlus size={18} />}
        onClick={handleAddNew}
      >
        Add New Product
      </Button>

      

      {/* ขวา */}
      <Group gap="xs">

      {/* ✅ EXPORT BUTTON */}
      <Button
        variant="light"
        color="green"
        onClick={handleExport}
      >
        Export CSV
      </Button>

        <MRT_GlobalFilterTextInput table={table} />
        <MRT_ToggleFiltersButton table={table} />
        <MRT_ShowHideColumnsButton table={table} />
        <MRT_ToggleDensePaddingButton table={table} />
        <MRT_ToggleFullScreenButton table={table} />
      </Group>
    </Group>
  ),

 // controlled state
  state: {
    isLoading: loading,
    columnOrder,
  },

  // อัปเดตเมื่อผู้ใช้ลาก column
  onColumnOrderChange: setColumnOrder,

  initialState: {
    density: "xs",
    showGlobalFilter: true,
    pagination: { pageIndex: 0, pageSize: 10 },
    columnVisibility: { ID: false },
  },
});

  return (
    <div style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      
      <style>{`
        /* Hide Sort Button Icons */
        .custom-table-styles
        th
        button[aria-label*="Sort"] {
          display: none !important;
        }
      `}</style>

      <Paper p="md" shadow="xs" style={{ position: "sticky", top: 0, zIndex: 100 }}>
        <Container size="xl">
          <Group justify="space-between">
            <Group>
              <Paper p={6} radius="md" bg="indigo" c="white">
                <IconPackage size={24} />
              </Paper>
              <div>
                <Title order={4}>Stock Manager</Title>
                {isAdmin && <Badge color="indigo">Admin Mode</Badge>}
              </div>
            </Group>
            <Button variant="light" color="red" leftSection={<IconLogout size={18} />} onClick={handleLogout}>
              Logout
            </Button>
          </Group>
        </Container>
      </Paper>

      <Container size="xl" py="xl">
        
        {/* 📊 STOCK BY PRODUCT CHART */}
        <Card shadow="sm" radius="md" withBorder mb="xl">
          <StockByProductChart products={products} />
        </Card>
          
          {/* Table Section */}
          <Card shadow="sm" radius="md" withBorder>
            <Box pos="relative">
                <LoadingOverlay visible={loading} overlayProps={{ blur: 2 }} />
                <MantineReactTable table={table} />
            </Box>
          </Card>

      </Container>
    </div>
  );
}