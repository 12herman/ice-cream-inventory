export const sortDateAndTime = async (data)=>{

   let sorting = await data.sort((a, b) => {
        // Convert "DD/MM/YYYY,HH.mm,ss" to a proper Date format "MM/DD/YYYY HH:mm:ss"
        let parseDate = (dateStr) => {
          let [datePart, timePart, seconds] = dateStr.split(','); // Split by comma to get date, time, and seconds
          let [day, month, year] = datePart.split('/');
          let [hour, minute] = timePart.split('.');
      
          // Construct a new Date object in the format "MM/DD/YYYY HH:mm:ss"
          return new Date(`${month}/${day}/${year} ${hour}:${minute}:${seconds}`);
        };
      
        let dateA = parseDate(a.createddate);
        let dateB = parseDate(b.createddate);
      
        // Sort by date, time, and seconds
        return dateA - dateB;
      });

      return sorting;
}
  