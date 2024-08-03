export const  TimestampJs =() => {
    const date = new Date();
    // Extract date components
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-indexed
    const year = date.getFullYear();

    // Extract time components
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    // Determine AM/PM
    const ampm = hours >= 12 ? 'pm' : 'am';
    
    // Convert to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'

    // Format time
    const formattedTime = `${hours}.${minutes}${ampm}`;

    // Format date
    const formattedDate = `${day}-${month}-${year}`;

    // Combine date and time
    return `${formattedDate},${formattedTime}`;
}

