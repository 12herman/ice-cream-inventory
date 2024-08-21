export const  TimestampJs =() => {
    const date = new Date();
    // Extract date components
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-indexed
    const year = date.getFullYear();

    // Extract time components
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    // Format time
    const formattedTime = `${hours}.${minutes}`;

    // Format date
    const formattedDate = `${day}/${month}/${year}`;

    // Combine date and time
    return `${formattedDate},${formattedTime}`;
}

