import React from 'react';
import styled from 'styled-components';

const AddSectionButton = ({
                              guideLinePosition,
                              setShowPopup,
                              onShowAddSectionPopup,
                          }) => {
    return (
        <StyledWrapper style={{ top: guideLinePosition - 8 }}>
            <Button
                type="button"
                onClick={() => {
                    setShowPopup(true);
                    if (typeof onShowAddSectionPopup === 'function') {
                        onShowAddSectionPopup();
                    }
                }}
            >
                <ButtonText>Thêm Section</ButtonText>
                <ButtonIcon>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="1"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-copy-plus"
                    >
                        <line x1="15" x2="15" y1="12" y2="18" />
                        <line x1="12" x2="18" y1="15" y2="15" />
                        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                    </svg>
                </ButtonIcon>
            </Button>
        </StyledWrapper>
    );
};

const StyledWrapper = styled.div`
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1002;
`;

const Button = styled.button`
    position: relative;
    width: 190px;
    height: 44px;
    cursor: pointer;
    display: flex;
    align-items: center;
    border: 1px solid #34974d;
    background-color: #3aa856;
    border-radius: 8px;
    overflow: hidden;

    &:hover {
        background: #34974d;
        justify-content: center;
    }

    &:active {
        border: 1px solid #2e8644;
    }
`;

const ButtonText = styled.span`
    transform: translateX(30px);
    color: #fff;
    font-weight: 600;
    transition: all 0.3s;

    ${Button}:hover & {
        color: transparent;
    }
`;

const ButtonIcon = styled.span`
    position: absolute;
    transform: translateX(115px);
    height: 100%;
    width: 45px;
    left: 30px;
    background-color: #34974d;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s;

    ${Button}:hover & {
        width: 160px;
        transform: translateX(0);
    }

    ${Button}:active & {
        background-color: #2e8644;
    }

    .lucide-copy-plus {
        width: 26px;
        stroke: #fff;
    }
`;

export default AddSectionButton;