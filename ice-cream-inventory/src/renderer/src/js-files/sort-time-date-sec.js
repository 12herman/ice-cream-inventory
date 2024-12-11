// Ensure this file exports the function
// Ensure this file exports the function
export const latestFirstSort = async (data) => {
  let sorting = data.sort((a, b) => {
    let parseDate = (dateStr) => {
      let [datePart, timePart] = dateStr.split(' ');
      let [day, month, year] = datePart.split('/');
      let [hour, minute, second] = timePart.split(':');

      // Create the date object with correct format for month/day/year
      return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
    };

    let dateA = parseDate(a.createddate);
    let dateB = parseDate(b.createddate);

    // Sort in descending order (latest first)
    return dateB - dateA;
  });

  return sorting;
};

export const oldestFirstSort = async (data) => {
  let sorting = data.sort((a, b) => {
    let parseDate = (dateStr) => {
      let [datePart, timePart] = dateStr.split(' ');
      let [day, month, year] = datePart.split('/');
      let [hour, minute, second] = timePart.split(':');

      // Create the date object with correct format for month/day/year
      return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
    };

    let dateA = parseDate(a.createddate);
    let dateB = parseDate(b.createddate);

    // Sort in descending order (latest first)
    return dateA - dateB;
  });

  return sorting;
};

export const recentDateFirstSort = async (data) => {
  let sorting = data.sort((a, b) => {
    let parseDate = (dateStr) => {
      let dateParts = dateStr.split(' ');
      let [day, month, year] = dateParts[0].split('/');
      let timePart = dateParts[1] ? dateParts[1] : '00:00';
      let formattedDate = `${year}-${month}-${day}T${timePart}:00`;
      return new Date(formattedDate);
    };

    let dateA = parseDate(a.date);
    let dateB = parseDate(b.date);

    // Sort in ascending order
    return dateA - dateB;
  });

  return sorting;
};