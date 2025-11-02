/**
=========================================================
* Material Dashboard 2 React - v2.2.0
=========================================================

* Product Page: https://www.creative-tim.com/product/material-dashboard-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

// React components
import { useEffect, useState } from "react";

// @mui material components
import Grid from "@mui/material/Grid";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import ReportsBarChart from "examples/Charts/BarCharts/ReportsBarChart";
import ReportsLineChart from "examples/Charts/LineCharts/ReportsLineChart";
import ComplexStatisticsCard from "examples/Cards/StatisticsCards/ComplexStatisticsCard";

// Data
import reportsBarChartData from "layouts/dashboard/data/reportsBarChartData";
import reportsLineChartData from "layouts/dashboard/data/reportsLineChartData";

// Dashboard components
import Projects from "layouts/dashboard/components/Projects";
import OrdersOverview from "layouts/dashboard/components/OrdersOverview";

const WEEKLY_SUMMARY_URL = "http://ezcode.ddns.net:8090/api/lumsumday/summary/weekly";

function Dashboard() {
  const [barChartData, setBarChartData] = useState(reportsBarChartData);
  const [lineChartData, setLineChartData] = useState(reportsLineChartData);

  useEffect(() => {
    const controller = new AbortController();

    const fetchWeeklySummary = async () => {
      try {
        const response = await fetch(WEEKLY_SUMMARY_URL, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const payload = await response.json();
        const rawEntries = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.result)
          ? payload.result
          : [];

        if (!rawEntries.length) {
          return;
        }

        const normalizedEntries = rawEntries.map((entry) => {
          if (!entry || typeof entry !== "object") {
            return {};
          }

          return Object.entries(entry).reduce((acc, [key, value]) => {
            acc[key.toLowerCase()] = value;
            return acc;
          }, {});
        });

        const labelCandidates = [
          "day",
          "weekday",
          "date",
          "week",
          "label",
          "name",
          "period",
        ];

        const labels = normalizedEntries.map((entry, index) => {
          const labelKey = labelCandidates.find((key) => {
            const labelValue = entry[key];
            return labelValue !== undefined && labelValue !== null && `${labelValue}`.trim() !== "";
          });

          if (!labelKey) {
            return `#${index + 1}`;
          }

          const labelValue = entry[labelKey];
          return typeof labelValue === "string" ? labelValue : `${labelValue}`;
        });

        const ensureTitleCase = (value) =>
          value
            .split(" ")
            .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
            .join(" ");

        const formatDatasetLabel = (key, fallback) => {
          if (!key) {
            return fallback;
          }

          const labelMap = {
            sumqty: "Sum Qty",
            qty: "Quantity",
            quantity: "Quantity",
            totalqty: "Total Qty",
            sumamt: "Sum Amount",
            amount: "Amount",
            totalamt: "Total Amount",
            totalamount: "Total Amount",
            sum: "Sum",
            ordercnt: "Order Count",
            ordercount: "Order Count",
            orders: "Orders",
            count: "Count",
          };

          if (labelMap[key]) {
            return labelMap[key];
          }

          return ensureTitleCase(key.replace(/_/g, " "));
        };

        const extractValues = (entries, keys, fallbackLabel) => {
          let detectedKey = null;

          const values = entries.map((entry) => {
            for (const key of keys) {
              if (entry[key] !== undefined && entry[key] !== null) {
                if (!detectedKey) {
                  detectedKey = key;
                }

                const numericValue = Number(entry[key]);
                return Number.isNaN(numericValue) ? 0 : numericValue;
              }
            }

            return 0;
          });

          return {
            values,
            hasMatch: Boolean(detectedKey),
            label: formatDatasetLabel(detectedKey, fallbackLabel),
          };
        };

        const sumQty = extractValues(
          normalizedEntries,
          ["sumqty", "qty", "quantity", "totalqty", "total_quantity"],
          "Sum Qty"
        );

        const sumAmt = extractValues(
          normalizedEntries,
          ["sumamt", "amount", "totalamt", "totalamount", "sum", "total"],
          "Sum Amount"
        );

        const orderCount = extractValues(
          normalizedEntries,
          ["ordercnt", "ordercount", "orders", "count"],
          "Order Count"
        );

        if (sumQty.hasMatch) {
          setBarChartData({
            labels,
            datasets: { label: sumQty.label, data: sumQty.values },
          });
        } else if (sumAmt.hasMatch) {
          setBarChartData({
            labels,
            datasets: { label: sumAmt.label, data: sumAmt.values },
          });
        }

        const salesSeries = sumAmt.hasMatch ? sumAmt : sumQty;
        const tasksSeries = orderCount.hasMatch ? orderCount : sumQty;

        if (salesSeries.hasMatch || tasksSeries.hasMatch) {
          setLineChartData({
            sales: {
              labels,
              datasets: {
                label: salesSeries.label,
                data: salesSeries.values,
              },
            },
            tasks: {
              labels,
              datasets: {
                label: tasksSeries.label,
                data: tasksSeries.values,
              },
            },
          });
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Failed to fetch weekly summary data", error);
        }
      }
    };

    fetchWeeklySummary();

    return () => {
      controller.abort();
    };
  }, []);

  const { sales, tasks } = lineChartData;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="dark"
                icon="weekend"
                title="Bookings"
                count={281}
                percentage={{
                  color: "success",
                  amount: "+55%",
                  label: "than lask week",
                }}
              />
            </MDBox>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                icon="leaderboard"
                title="Today's Users"
                count="2,300"
                percentage={{
                  color: "success",
                  amount: "+3%",
                  label: "than last month",
                }}
              />
            </MDBox>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="success"
                icon="store"
                title="Revenue"
                count="34k"
                percentage={{
                  color: "success",
                  amount: "+1%",
                  label: "than yesterday",
                }}
              />
            </MDBox>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="primary"
                icon="person_add"
                title="Followers"
                count="+91"
                percentage={{
                  color: "success",
                  amount: "",
                  label: "Just updated",
                }}
              />
            </MDBox>
          </Grid>
        </Grid>
        <MDBox mt={4.5}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6} lg={4}>
              <MDBox mb={3}>
                <ReportsBarChart
                  color="info"
                  title="Daily Sumqty"
                  description="Weekly summary fetched from API"
                  date="ezcode.ddns.net"
                  chart={barChartData}
                />
              </MDBox>
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
              <MDBox mb={3}>
                <ReportsLineChart
                  color="success"
                  title="daily sales"
                  description={
                    <>
                      (<strong>+15%</strong>) increase in today sales.
                    </>
                  }
                  date="Synced with weekly summary"
                  chart={sales}
                />
              </MDBox>
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
              <MDBox mb={3}>
                <ReportsLineChart
                  color="dark"
                  title="completed tasks"
                  description="Last Campaign Performance"
                  date="Synced with weekly summary"
                  chart={tasks}
                />
              </MDBox>
            </Grid>
          </Grid>
        </MDBox>
        <MDBox>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6} lg={8}>
              <Projects />
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
              <OrdersOverview />
            </Grid>
          </Grid>
        </MDBox>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Dashboard;
