import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '@landinghub/api';
import SidebarComponent from '../components/pages-content/SidebarComponent';
import HeaderComponent from '../components/pages-content/HeaderComponent';
import CreatePagePopup from '../components/pages-content/CreatePagePopup';
import DogLoader from '../components/Loader';
import { toast } from 'react-toastify';
import '../styles/Templates.css';

const Templates = () => {

};

export default Templates;