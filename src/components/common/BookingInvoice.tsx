// // src/components/common/Invoice.tsx

// import React from "react";
// import {
//   Page,
//   Text,
//   View,
//   Document,
//   StyleSheet,
//   Image,
// } from "@react-pdf/renderer";

// // Define the styles for the PDF
// // Theme Colors: Red: #D32F2F, Yellow: #FFC107, Dark Text: #1F2937, Light Text: #4B5563
// const styles = StyleSheet.create({
//   page: {
//     fontFamily: "Helvetica",
//     fontSize: 11,
//     paddingTop: 30,
//     paddingLeft: 40,
//     paddingRight: 40,
//     paddingBottom: 30,
//     backgroundColor: "#FFFFFF",
//   },
//   header: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 20,
//   },
//   logo: {
//     width: 70,
//     height: 70,
//   },
//   companyName: {
//     fontSize: 24,
//     fontWeight: "bold",
//     color: "#D32F2F", // Red theme color for the company name
//   },
//   section: {
//     marginBottom: 20,
//   },
//   sectionHeader: {
//     fontSize: 14,
//     fontWeight: "bold",
//     color: "#1F2937",
//     marginBottom: 10,
//     borderBottomWidth: 2,
//     borderBottomColor: "#FFC107", // Yellow theme color for underlines
//     paddingBottom: 5,
//   },
//   customerInfo: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//   },
//   infoColumn: {
//     flexDirection: "column",
//   },
//   text: {
//     fontSize: 10,
//     color: "#4B5563",
//     marginBottom: 3,
//   },
//   boldText: {
//     fontWeight: "bold",
//     fontSize: 10,
//     color: "#1F2937",
//   },
//   table: {
//     width: "auto",
//     marginTop: 15,
//   },
//   tableHeader: {
//     flexDirection: "row",
//     backgroundColor: "#FFC107", // Yellow theme for table header
//     borderBottomWidth: 1,
//     borderColor: "#D32F2F",
//     alignItems: "center",
//     height: 24,
//   },
//   tableHeaderCell: {
//     color: "#1F2937",
//     fontWeight: "bold",
//     fontSize: 10,
//   },
//   tableRow: {
//     flexDirection: "row",
//     borderBottomWidth: 1,
//     borderColor: "#EEEEEE",
//     alignItems: "center",
//     height: 24,
//   },
//   tableCell: {
//     fontSize: 9,
//     color: "#4B5563",
//   },
//   col1: { width: "25%" },
//   col2: { width: "25%" },
//   col3: { width: "20%" },
//   col4: { width: "15%" },
//   col5: { width: "15%" },
//   summary: {
//     flexDirection: "row",
//     justifyContent: "flex-end",
//     marginTop: 20,
//   },
//   summaryText: {
//     fontSize: 12,
//     fontWeight: "bold",
//   },
//   totalAmount: {
//     color: "#D32F2F", // Red theme for the final total
//     fontSize: 16,
//   },
//   footer: {
//     position: "absolute",
//     bottom: 30,
//     left: 40,
//     right: 40,
//     textAlign: "center",
//     color: "grey",
//     fontSize: 9,
//   },
// });

// // Define the Invoice Document component
// // It receives formData and bookings as props from your BookingClient page
// const Invoice = ({ formData, bookings }: { formData: any; bookings: any[] }) => (
//   <Document>
//     <Page size="A4" style={styles.page}>
//       {/* Header with Logo and Company Name */}
//       <View style={styles.header}>
//         {/* Replace with your actual logo URL */}
//         <Image
//           style={styles.logo}
//           src="https://cdn-icons-png.flaticon.com/512/825/825590.png"
//         />
//         <Text style={styles.companyName}>Your Company Name</Text>
//       </View>

//       {/* Customer and Invoice Details */}
//       <View style={styles.section}>
//         <View style={styles.customerInfo}>
//           <View style={styles.infoColumn}>
//             <Text style={styles.boldText}>Billed To:</Text>
//             <Text style={styles.text}>{formData.fullName}</Text>
//             <Text style={styles.text}>{formData.mobile}</Text>
//             <Text style={styles.text}>{formData.address}</Text>
//           </View>
//           <View style={[styles.infoColumn, { alignItems: "flex-end" }]}>
//             <Text style={styles.boldText}>Invoice #</Text>
//             <Text style={styles.text}>{`INV-${Date.now()}`}</Text>
//             <Text style={styles.boldText}>Date of Issue</Text>
//             <Text style={styles.text}>
//               {new Date().toLocaleDateString("en-GB")}
//             </Text>
//           </View>
//         </View>
//       </View>

//       {/* Booking Items Table */}
//       <View style={styles.section}>
//         <Text style={styles.sectionHeader}>Booking Details</Text>
//         <View style={styles.table}>
//           {/* Table Header */}
//           <View style={styles.tableHeader}>
//             <Text style={[styles.tableHeaderCell, styles.col1, { paddingLeft: 5 }]}>Category</Text>
//             <Text style={[styles.tableHeaderCell, styles.col2]}>Subcategory</Text>
//             <Text style={[styles.tableHeaderCell, styles.col3]}>Start Date</Text>
//             <Text style={[styles.tableHeaderCell, styles.col4]}>End Date</Text>
//             <Text style={[styles.tableHeaderCell, styles.col5, { textAlign: 'right', paddingRight: 5 }]}>Price</Text>
//           </View>
//           {/* Table Rows */}
//           {bookings.map((item, index) => (
//             <View style={styles.tableRow} key={index}>
//               <Text style={[styles.tableCell, styles.col1, { paddingLeft: 5 }]}>{item.categoryName}</Text>
//               <Text style={[styles.tableCell, styles.col2]}>{item.subcategoryName}</Text>
//               <Text style={[styles.tableCell, styles.col3]}>{item.startDate}</Text>
//               <Text style={[styles.tableCell, styles.col4]}>{item.endDate}</Text>
//               <Text style={[styles.tableCell, styles.col5, { textAlign: 'right', paddingRight: 5 }]}>₹{item.price}</Text>
//             </View>
//           ))}
//         </View>
//       </View>

//       {/* Summary Section for Total, Payment Method, and Status */}
//       <View style={styles.summary}>
//         <View style={styles.infoColumn}>
//             <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
//                 <Text style={styles.summaryText}>Payment Method: </Text>
//                 <Text style={[styles.text, { textTransform: 'capitalize'}]}>{formData.payment_method}</Text>
//             </View>
//              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
//                 <Text style={styles.summaryText}>Payment Status: </Text>
//                 <Text style={[styles.text, { textTransform: 'capitalize'}]}>{formData.payment_status}</Text>
//             </View>
//             <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, borderTopWidth: 2, borderColor: '#FFC107', paddingTop: 10 }}>
//                 <Text style={styles.summaryText}>Total: </Text>
//                 <Text style={styles.totalAmount}>₹{formData.total}</Text>
//             </View>
//         </View>
//       </View>
      
//       {/* Footer */}
//       <Text style={styles.footer}>
//         Thank you for your business!
//       </Text>
//     </Page>
//   </Document>
// );

// export default Invoice;